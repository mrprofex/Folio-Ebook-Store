import { Router, Response } from 'express';
import { db } from '../db.js';
import { User } from '../../src/types/index.js';
import { hashPassword, comparePassword, generateToken, authMiddleware, AuthRequest, verifyGoogleIdToken } from '../auth.js';

const router = Router();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_PASSWORD_HASH = ADMIN_PASSWORD ? hashPassword(ADMIN_PASSWORD) : null;

if (!ADMIN_EMAIL) {
  console.warn('[auth] ADMIN_EMAIL is not set. Admin login will be unavailable.');
}
if (!ADMIN_PASSWORD) {
  console.warn('[auth] ADMIN_PASSWORD is not set. Admin login will be unavailable.');
}
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  console.log('[auth] Admin credentials configured for:', ADMIN_EMAIL);
}

// Auth diagnostic endpoint (no auth required)
router.get('/diagnostic', async (req, res) => {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        adminEmailConfigured: Boolean(ADMIN_EMAIL),
        adminPasswordConfigured: Boolean(ADMIN_PASSWORD),
        googleClientIdConfigured: Boolean(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID),
        authSecretConfigured: Boolean(process.env.AUTH_SECRET || process.env.JWT_SECRET),
        databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
        nodeEnv: process.env.NODE_ENV || 'development',
        vercel: process.env.VERCEL === '1'
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID ? 'configured' : 'missing'
      },
      database: {
        connected: false
      }
    };

    // Test database connection
    try {
      await db.findUserById('diagnostic-test');
      diagnostics.database.connected = true;
    } catch (dbErr: any) {
      diagnostics.database.error = dbErr.message;
      diagnostics.database.code = dbErr.code;
    }

    res.json(diagnostics);
  } catch (err: any) {
    res.status(500).json({ error: 'DIAGNOSTIC_FAILED', message: err.message });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Passwords do not match' });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Please provide a valid email address' });
    }

    // Check duplicate
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'DUPLICATE_EMAIL', message: 'An account with this email already exists' });
    }

    const passwordHash = hashPassword(password);
    const newUser = await db.createUser({
      name,
      email,
      passwordHash,
      role: 'USER'
    });

    const token = generateToken(newUser);
    return res.status(201).json({ token, user: newUser });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to complete registration' });
  }
});

// Google one-click login
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Google authentication token is missing' });
    }

    // Log diagnostic info (safe, no secrets)
    console.log('[auth/google] Attempting Google login. Client ID configured:', Boolean(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID));

    const payload = await verifyGoogleIdToken(idToken);
    if (!payload || !payload.email) {
      console.error('[auth/google] Google token verification failed. Check GOOGLE_CLIENT_ID in Vercel environment variables.');
      return res.status(401).json({ error: 'INVALID_GOOGLE_TOKEN', message: 'Could not verify your Google account. Please ensure Google OAuth is configured correctly.' });
    }

    const email = payload.email.toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const name = (payload.name || email.split('@')[0]).trim();

    console.log('[auth/google] Google token verified for email:', email);

    let user = await db.findUserByEmail(email);

    // Administrators must use the dedicated email/password flow at /admin.
    // Do not allow a configured admin account to receive an admin session via
    // the public Google sign-in endpoint.
    if (email === adminEmail || user?.role === 'ADMIN') {
      console.log('[auth/google] Admin account attempted Google login:', email);
      return res.status(403).json({
        error: 'ADMIN_GOOGLE_LOGIN_DISABLED',
        message: 'Administrator accounts must sign in with email and password from the admin login page.'
      });
    }

    if (!user) {
      // First-time Google user: create an account (random password, never used for login)
      const randomHash = hashPassword(`${Math.random().toString(36).slice(2)}${Date.now()}`);
      console.log('[auth/google] Creating new user for email:', email);
      const created = await db.createUser({
        name,
        email,
        passwordHash: randomHash,
        role: 'USER'
      });
      user = created as User & { passwordHash: string };
    } else {
      console.log('[auth/google] Existing user logged in via Google:', email);
    }

    await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const safeUser = await db.findUserById(user.id);
    if (!safeUser) {
      console.error('[auth/google] User retrieval failed after Google login for:', email);
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'User retrieval failed' });
    }

    const token = generateToken(safeUser);
    console.log('[auth/google] Google login successful for:', email);
    return res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('[auth/google] Google login error:', err);
    const errorMessage = err.message || 'Google sign-in failed. Please try again.';
    return res.status(401).json({ error: 'GOOGLE_AUTH_FAILED', message: errorMessage });
  }
});

// Admin login — validates against ADMIN_EMAIL / ADMIN_PASSWORD env variables
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Log diagnostic info (safe, no secrets)
    console.log('[auth/admin-login] Attempt. ADMIN_EMAIL configured:', Boolean(ADMIN_EMAIL), 'ADMIN_PASSWORD configured:', Boolean(ADMIN_PASSWORD));

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
      console.error('[auth/admin-login] Admin credentials not configured in environment variables.');
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'Admin authentication is not configured on the server. Contact support.' });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail !== ADMIN_EMAIL || !comparePassword(password, ADMIN_PASSWORD_HASH)) {
      console.log('[auth/admin-login] Invalid credentials attempt for:', normalizedEmail);
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid administrator credentials' });
    }

    console.log('[auth/admin-login] Credentials valid. Looking up admin user:', ADMIN_EMAIL);

    let user = await db.findUserByEmail(ADMIN_EMAIL);

    if (!user) {
      console.log('[auth/admin-login] Admin user not found in database. Creating...');
      const randomHash = hashPassword(`${Math.random().toString(36).slice(2)}${Date.now()}`);
      const created = await db.createUser({
        name: ADMIN_EMAIL.split('@')[0],
        email: ADMIN_EMAIL,
        passwordHash: randomHash,
        role: 'ADMIN'
      });
      user = created as User & { passwordHash: string };
      console.log('[auth/admin-login] Admin user created with ID:', user.id);
    } else if (user.role !== 'ADMIN') {
      console.log('[auth/admin-login] User exists but role is', user.role, '- upgrading to ADMIN');
      await db.updateUser(user.id, { role: 'ADMIN' });
    }

    await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const safeUser = await db.findUserById(user.id);
    if (!safeUser) {
      console.error('[auth/admin-login] Admin user retrieval failed after creation/update for ID:', user.id);
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'User retrieval failed' });
    }

    const token = generateToken(safeUser);
    console.log('[auth/admin-login] Admin login successful for:', ADMIN_EMAIL);
    return res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('[auth/admin-login] Admin login error:', err);
    const errorMessage = err.message || 'Admin login failed';
    return res.status(500).json({ error: 'SERVER_ERROR', message: errorMessage });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email and password are required' });
    }

    const userWithHash = await db.findUserByEmail(email);
    if (!userWithHash) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    if (!userWithHash.isActive) {
      return res.status(403).json({ error: 'ACCOUNT_DEACTIVATED', message: 'Your account has been deactivated. Please contact support.' });
    }

    const isValid = comparePassword(password, userWithHash.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    // Update last login
    await db.updateUser(userWithHash.id, { lastLoginAt: new Date().toISOString() });

    const safeUser = await db.findUserById(userWithHash.id);
    if (!safeUser) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'User retrieval failed' });
    }

    const token = generateToken(safeUser);
    return res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Authentication failed' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// Update profile / password
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const updates: any = {};
    if (name && name.trim()) {
      updates.name = name.trim();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'New password must be at least 6 characters' });
      }

      const userWithHash = await db.findUserWithHashById(userId);
      if (!userWithHash) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
      }

      if (!currentPassword || !comparePassword(currentPassword, userWithHash.passwordHash)) {
        return res.status(400).json({ error: 'INVALID_PASSWORD', message: 'Current password is incorrect' });
      }

      updates.passwordHash = hashPassword(newPassword);
    }

    const updatedUser = await db.updateUser(userId, updates);
    return res.json({ user: updatedUser, message: 'Profile updated successfully' });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update profile' });
  }
});

export default router;

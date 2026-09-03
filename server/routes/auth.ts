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

    const payload = await verifyGoogleIdToken(idToken);
    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'INVALID_GOOGLE_TOKEN', message: 'Could not verify your Google account' });
    }

    const email = payload.email.toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const name = (payload.name || email.split('@')[0]).trim();

    let user = await db.findUserByEmail(email);

    // Administrators must use the dedicated email/password flow at /admin.
    // Do not allow a configured admin account to receive an admin session via
    // the public Google sign-in endpoint.
    if (email === adminEmail || user?.role === 'ADMIN') {
      return res.status(403).json({
        error: 'ADMIN_GOOGLE_LOGIN_DISABLED',
        message: 'Administrator accounts must sign in with email and password from the admin login page.'
      });
    }

    if (!user) {
      // First-time Google user: create an account (random password, never used for login)
      const randomHash = hashPassword(`${Math.random().toString(36).slice(2)}${Date.now()}`);
      const created = await db.createUser({
        name,
        email,
        passwordHash: randomHash,
        role: 'USER'
      });
      user = created as User & { passwordHash: string };
    }

    await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const safeUser = await db.findUserById(user.id);
    if (!safeUser) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'User retrieval failed' });
    }

    const token = generateToken(safeUser);
    return res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('Google login error:', err);
    return res.status(401).json({ error: 'GOOGLE_AUTH_FAILED', message: 'Google sign-in failed. Please try again.' });
  }
});

// Admin login — validates against ADMIN_EMAIL / ADMIN_PASSWORD env variables
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'Admin authentication is not configured on the server.' });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email and password are required' });
    }

    if (email.toLowerCase().trim() !== ADMIN_EMAIL || !comparePassword(password, ADMIN_PASSWORD_HASH)) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid administrator credentials' });
    }

    let user = await db.findUserByEmail(ADMIN_EMAIL);

    if (!user) {
      const randomHash = hashPassword(`${Math.random().toString(36).slice(2)}${Date.now()}`);
      const created = await db.createUser({
        name: ADMIN_EMAIL.split('@')[0],
        email: ADMIN_EMAIL,
        passwordHash: randomHash,
        role: 'ADMIN'
      });
      user = created as User & { passwordHash: string };
    } else if (user.role !== 'ADMIN') {
      await db.updateUser(user.id, { role: 'ADMIN' });
    }

    await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const safeUser = await db.findUserById(user.id);
    if (!safeUser) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'User retrieval failed' });
    }

    const token = generateToken(safeUser);
    return res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Admin login failed' });
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

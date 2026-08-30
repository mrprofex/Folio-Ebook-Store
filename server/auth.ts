import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { User } from '../src/types';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'secret-jwt-key-ebook-store-2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/**
 * Verify a Google Identity Services ID token (JWT) without external dependencies.
 * Validates audience, issuer, expiry and email verification via Google's tokeninfo endpoint.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<{ email: string; name?: string } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error('GOOGLE_CLIENT_ID is not configured on the server.');
    return null;
  }

  try {
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!resp.ok) return null;
    const payload: any = await resp.json();

    if (payload.aud !== clientId) return null;
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') return null;
    if (Number(payload.exp) * 1000 < Date.now()) return null;
    if (payload.email_verified === 'false' || payload.email_verified === false) return null;
    if (!payload.email) return null;

    return { email: payload.email, name: payload.name };
  } catch (err) {
    console.error('Google token verification error:', err);
    return null;
  }
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // Check authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const user = await db.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'USER_NOT_FOUND', message: 'User account no longer exists' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'ACCOUNT_DEACTIVATED', message: 'Your account has been deactivated. Please contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalid or expired' });
  }
}

export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await db.findUserById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore invalid optional tokens
  }
  next();
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Administrator privileges required' });
  }
  next();
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Verify a token and return its claims, or null if it is missing/invalid.
 * Shared by the HTTP middleware and the Socket.IO handshake so both enforce the
 * same rule — the socket used to require no authentication at all (SEC-API-001).
 */
export function verifyToken(token?: string): AuthUser | null {
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret) as AuthUser;
  } catch {
    return null;
  }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const user = verifyToken(token);

  // 401, not 400: these are authentication failures (missing or invalid
  // credentials), not malformed client requests (SEC-ERR-002). A single generic
  // message avoids telling an attacker whether the token was absent, expired, or
  // forged.
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  req.user = user;
  next();
};

/**
 * Role gate. Deny-by-default: a route that names required roles rejects anyone
 * whose token role is not in the list (SEC-AUTHZ-001). For genuinely sensitive
 * actions, re-read the role from the database rather than trusting the token
 * claim — do not rely on this helper alone for privilege decisions.
 */
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
    }
    next();
  };
};

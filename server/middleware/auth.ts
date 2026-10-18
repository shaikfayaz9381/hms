import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dataService } from '../services/dataService.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'medpulse-hospital-development-secret-key-32-bytes-minimum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  firstName: string;
  lastName: string;
  doctorId?: string;
  patientId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Validates JWT Bearer token on incoming requests.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied: Authentication token required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired session token. Please sign in again.' });
  }
}

/**
 * Role-based access control guard.
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      void dataService.logAudit(
        req.user.id,
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        req.originalUrl,
        `Role ${req.user.role} attempted to access route requiring [${roles.join(', ')}]`,
        req.ip
      );
      res.status(403).json({
        error: `Forbidden: This resource requires one of the following permissions: [${roles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}

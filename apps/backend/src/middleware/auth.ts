import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { createErrorResponse } from '@sports-betting/shared';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json(createErrorResponse('Access token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json(createErrorResponse('Invalid token'));
    }

    if (!user.isActive) {
      return res.status(401).json(createErrorResponse('Account is deactivated'));
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(createErrorResponse('Invalid token'));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(createErrorResponse('Insufficient permissions'));
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin', 'superadmin']);
export const requireSuperAdmin = requireRole(['superadmin']);
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

/**
 * Attaches the authenticated user to req.user for every request carrying a
 * valid Bearer token.
 *
 * The account's status is re-validated against the database on EVERY request
 * so that suspended / deactivated / deleted accounts lose access immediately
 * (not only at their next login attempt). When an account is blocked, the
 * user context is left unset and `req.accountBlockedReason` records why, so
 * GraphQL resolvers can return a precise error code to the client.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Proceed without user
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
        return next();
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const userId = decoded?.id || decoded?._id || decoded?.userId;

        if (!userId) {
            return next();
        }

        const dbUser = await User.findById(userId).select('role status isDeleted permissions').lean();

        if (!dbUser || dbUser.isDeleted) {
            (req as any).accountBlockedReason = 'deleted';
            return next();
        }

        // Legacy users created before the status field existed have no status —
        // treat them as active rather than blocking them accidentally.
        const status = dbUser.status || 'active';

        if (status !== 'active') {
            (req as any).accountBlockedReason = status; // 'suspended' | 'deactivated'
            return next();
        }

        // Attach token claims but refresh role + permissions from the DB so
        // permission changes apply immediately (no need to re-login).
        (req as any).user = { ...decoded, role: dbUser.role, permissions: dbUser.permissions || [] };
        next();
    } catch (error) {
        next(); // Proceed without user even on error
    }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized: Authentication required' });
    }
    next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    next();
};

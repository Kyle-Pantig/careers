import { Elysia } from 'elysia';
import { verifyToken, JWTPayload } from '../lib/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .derive({ as: 'global' }, ({ cookie }) => {
    const token = cookie.token?.value as string | undefined;
    
    if (!token) {
      return { user: null };
    }

    const payload = verifyToken(token);
    return { user: payload };
  })
  .macro({
    isAuthenticated: () => ({
      beforeHandle: ({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
      },
    }),
    hasRole: (roles: string | string[]) => ({
      beforeHandle: ({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        const hasRequiredRole = requiredRoles.some((role) => user.roles.includes(role));

        if (!hasRequiredRole) {
          set.status = 403;
          return { error: 'Forbidden: Insufficient permissions' };
        }
      },
    }),
    isAdmin: () => ({
      beforeHandle: ({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        if (!user.roles.includes('admin')) {
          set.status = 403;
          return { error: 'Forbidden: Admin access required' };
        }
      },
    }),
  });

// Helper to check if user is the protected admin
export function isProtectedAdmin(email: string): boolean {
  return email === ADMIN_EMAIL;
}

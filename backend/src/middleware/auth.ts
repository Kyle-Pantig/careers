import { Elysia } from 'elysia';
import { verifyToken, JWTPayload } from '../lib/auth';
import { prisma } from '../lib/prisma';
import {
  Permission,
  STAFF_PERMISSION_LEVELS,
  hasPermission as checkPermissionByLevel,
} from '../../../shared/validators/permissions';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

// Helper to get user permission level from database
async function getUserPermissionLevel(userId: string): Promise<{
  isAdmin: boolean;
  permissionLevel: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user) return { isAdmin: false, permissionLevel: null };

  // Check if admin
  const isAdmin = user.roles.some((ur) => ur.role.name === 'admin');
  if (isAdmin) {
    return { isAdmin: true, permissionLevel: STAFF_PERMISSION_LEVELS.CAN_EDIT };
  }

  // Get permission level from staff role
  const staffRole = user.roles.find((ur) => ur.role.name === 'staff');
  if (staffRole) {
    return {
      isAdmin: false,
      permissionLevel: (staffRole.permissionLevel as string) || STAFF_PERMISSION_LEVELS.CAN_READ,
    };
  }

  return { isAdmin: false, permissionLevel: null };
}

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
    // New simplified permission check using permission levels
    hasPermission: (permission: Permission) => ({
      beforeHandle: async ({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        // Admin always has all permissions
        if (user.roles.includes('admin')) {
          return;
        }

        const { permissionLevel } = await getUserPermissionLevel(user.userId);

        if (!checkPermissionByLevel(permissionLevel, permission)) {
          set.status = 403;
          return { error: 'Forbidden: You do not have permission to perform this action' };
        }
      },
    }),
    // New convenience macros for the simplified permission system
    canEdit: () => ({
      beforeHandle: async ({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        // Admin always has full access
        if (user.roles.includes('admin')) {
          return;
        }

        const { permissionLevel } = await getUserPermissionLevel(user.userId);

        if (permissionLevel !== STAFF_PERMISSION_LEVELS.CAN_EDIT) {
          set.status = 403;
          return { error: 'Forbidden: You need edit permissions to perform this action' };
        }
      },
    }),
    canRead: () => ({
      beforeHandle: async ({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        // Admin always has full access
        if (user.roles.includes('admin')) {
          return;
        }

        const { permissionLevel } = await getUserPermissionLevel(user.userId);

        // canRead is satisfied by either canRead or canEdit
        if (
          permissionLevel !== STAFF_PERMISSION_LEVELS.CAN_READ &&
          permissionLevel !== STAFF_PERMISSION_LEVELS.CAN_EDIT
        ) {
          set.status = 403;
          return { error: 'Forbidden: You need read permissions to perform this action' };
        }
      },
    }),
    // Verify API Secret for public routes
    verifyApiSecret: () => ({
      beforeHandle: ({ request, set }) => {
        const secret = request.headers.get('x-api-secret');
        const envSecret = process.env.API_SECRET_TOKEN;

        // If env var is not set, we might want to log a warning but proceed 
        // OR block. Given the user explicitly asked for security, blocking is safer,
        // but might break dev if they forget. I'll block.
        if (!envSecret) {
          console.error('missing in server environment');
          set.status = 500;
          return { error: 'Server configuration error' };
        }

        if (secret !== envSecret) {
          set.status = 401;
          return { error: 'Unauthorized Access' };
        }
      },
    }),
  });

// Helper to check if user is the protected admin
export function isProtectedAdmin(email: string): boolean {
  return email === ADMIN_EMAIL;
}

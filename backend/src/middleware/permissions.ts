import { prisma } from '../lib/prisma';
import {
  STAFF_PERMISSION_LEVELS,
  canEdit,
  canRead,
  hasPermission,
  type Permission,
} from '../../../shared/validators/permissions';

export interface UserWithPermissions {
  id: string;
  email: string;
  roles: Array<{
    role: {
      name: string;
    };
    permissionLevel: string | null;
  }>;
}

/**
 * Get the permission level for a user
 * Returns the highest permission level across all roles
 */
export function getUserPermissionLevel(user: UserWithPermissions): string | null {
  for (const userRole of user.roles) {
    // Admin has full access
    if (userRole.role.name === 'admin') {
      return STAFF_PERMISSION_LEVELS.CAN_EDIT;
    }
  }

  // Check staff roles for permission level
  for (const userRole of user.roles) {
    if (userRole.role.name === 'staff' && userRole.permissionLevel) {
      // If any role has canEdit, return canEdit
      if (userRole.permissionLevel === STAFF_PERMISSION_LEVELS.CAN_EDIT) {
        return STAFF_PERMISSION_LEVELS.CAN_EDIT;
      }
    }
  }

  // Check for canRead
  for (const userRole of user.roles) {
    if (userRole.role.name === 'staff' && userRole.permissionLevel) {
      if (userRole.permissionLevel === STAFF_PERMISSION_LEVELS.CAN_READ) {
        return STAFF_PERMISSION_LEVELS.CAN_READ;
      }
    }
  }

  return null;
}

/**
 * Check if user can perform edit operations
 */
export function checkCanEdit(user: UserWithPermissions | null): boolean {
  if (!user) return false;

  // Admin always has full access
  if (user.roles.some((ur) => ur.role.name === 'admin')) {
    return true;
  }

  const permissionLevel = getUserPermissionLevel(user);
  return canEdit(permissionLevel);
}

/**
 * Check if user can perform view operations
 */
export function checkCanRead(user: UserWithPermissions | null): boolean {
  if (!user) return false;

  // Admin always has full access
  if (user.roles.some((ur) => ur.role.name === 'admin')) {
    return true;
  }

  const permissionLevel = getUserPermissionLevel(user);
  return canRead(permissionLevel);
}

/**
 * Check if user has a specific legacy permission
 * This provides backward compatibility
 */
export function checkPermission(user: UserWithPermissions | null, permission: Permission): boolean {
  if (!user) return false;

  // Admin has all permissions
  if (user.roles.some((ur) => ur.role.name === 'admin')) {
    return true;
  }

  const permissionLevel = getUserPermissionLevel(user);
  return hasPermission(permissionLevel, permission);
}

/**
 * Check if user is admin or staff (for basic dashboard access)
 */
export function isAdminOrStaff(user: UserWithPermissions | null): boolean {
  if (!user) return false;

  return user.roles.some(
    (ur) => ur.role.name === 'admin' || ur.role.name === 'staff'
  );
}

/**
 * Fetch user with permission level from database
 */
export async function fetchUserWithPermissions(userId: string): Promise<UserWithPermissions | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      roles: {
        select: {
          permissionLevel: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    roles: user.roles.map((ur) => ({
      role: ur.role,
      permissionLevel: ur.permissionLevel as string | null,
    })),
  };
}

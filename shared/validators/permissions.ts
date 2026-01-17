import { z } from 'zod';

// ============================================
// Simplified Staff Permission Levels
// ============================================

/**
 * Staff Permission Levels:
 * - canEdit: Full access - can create, edit, delete, update, email
 * - canRead: View only - can view all content, but cannot modify anything
 */
export const STAFF_PERMISSION_LEVELS = {
  CAN_EDIT: 'canEdit',
  CAN_READ: 'canRead',
} as const;

export type StaffPermissionLevel = (typeof STAFF_PERMISSION_LEVELS)[keyof typeof STAFF_PERMISSION_LEVELS];

// ============================================
// Permission Level Descriptions (for UI)
// ============================================

export const PERMISSION_LEVEL_INFO = {
  [STAFF_PERMISSION_LEVELS.CAN_EDIT]: {
    label: 'Full Access',
    description: 'Can create, edit, delete, and email. Full control over jobs, applications, industries, and users.',
    capabilities: [
      'View all jobs, applications, industries, and users',
      'Create new jobs and industries',
      'Edit existing jobs and applications',
      'Delete jobs, applications, and industries',
      'Publish/unpublish jobs',
      'Send emails to applicants',
      'Update application status and notes',
    ],
  },
  [STAFF_PERMISSION_LEVELS.CAN_READ]: {
    label: 'View Only',
    description: 'Can view all content but cannot make any changes.',
    capabilities: [
      'View all jobs, applications, industries, and users',
      'View dashboard statistics',
      'Export and review data',
    ],
  },
} as const;

// ============================================
// Default Permission Level per Role
// ============================================

export const DEFAULT_ROLE_PERMISSION_LEVEL: Record<string, StaffPermissionLevel | null> = {
  admin: null, // Admin has full access regardless (handled separately)
  staff: STAFF_PERMISSION_LEVELS.CAN_READ, // Default staff to view-only for safety
  user: null, // Regular users don't have staff permissions
};

// ============================================
// Zod Schema for Staff Permission Level
// ============================================

export const staffPermissionLevelSchema = z.enum(['canEdit', 'canRead']);

// ============================================
// Helper Functions
// ============================================

/**
 * Check if user can edit (has full access)
 */
export function canEdit(permissionLevel: string | null | undefined): boolean {
  return permissionLevel === STAFF_PERMISSION_LEVELS.CAN_EDIT;
}

/**
 * Check if user can read (has at least view access)
 */
export function canRead(permissionLevel: string | null | undefined): boolean {
  return (
    permissionLevel === STAFF_PERMISSION_LEVELS.CAN_READ ||
    permissionLevel === STAFF_PERMISSION_LEVELS.CAN_EDIT
  );
}

/**
 * Check if user has a specific permission based on their level and the action type
 */
export function hasPermissionForAction(
  permissionLevel: string | null | undefined,
  action: 'view' | 'create' | 'edit' | 'delete' | 'email'
): boolean {
  if (!permissionLevel) return false;

  // View action only requires canRead or canEdit
  if (action === 'view') {
    return canRead(permissionLevel);
  }

  // All other actions require canEdit
  return canEdit(permissionLevel);
}

// ============================================
// Legacy Compatibility (for gradual migration)
// Keeping old permission constants mapped to new system
// ============================================

export const PERMISSIONS = {
  // Jobs permissions
  JOBS_VIEW: 'jobs.view',
  JOBS_CREATE: 'jobs.create',
  JOBS_EDIT: 'jobs.edit',
  JOBS_DELETE: 'jobs.delete',
  JOBS_PUBLISH: 'jobs.publish',

  // Applications permissions
  APPLICATIONS_VIEW: 'applications.view',
  APPLICATIONS_EDIT: 'applications.edit',
  APPLICATIONS_EMAIL: 'applications.email',
  APPLICATIONS_DELETE: 'applications.delete',

  // Users permissions
  USERS_VIEW: 'users.view',
  USERS_EDIT: 'users.edit',
  USERS_CHANGE_ROLE: 'users.changeRole',
  USERS_DEACTIVATE: 'users.deactivate',

  // Industries permissions
  INDUSTRIES_VIEW: 'industries.view',
  INDUSTRIES_MANAGE: 'industries.manage',

  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard.view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Map old granular permission to new permission level requirement
 */
export function getRequiredLevelForPermission(permission: Permission): 'view' | 'edit' {
  const viewPermissions: Permission[] = [
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.INDUSTRIES_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
  ];

  return viewPermissions.includes(permission) ? 'view' : 'edit';
}

/**
 * Check if permission level grants a specific legacy permission
 * This helps with backward compatibility during migration
 */
export function hasPermission(permissionLevel: string | null | undefined, permission: Permission): boolean {
  if (!permissionLevel) return false;

  const requiredLevel = getRequiredLevelForPermission(permission);

  if (requiredLevel === 'view') {
    return canRead(permissionLevel);
  }

  return canEdit(permissionLevel);
}

// ============================================
// Get all permission level keys
// ============================================

export function getAllPermissionLevels(): StaffPermissionLevel[] {
  return Object.values(STAFF_PERMISSION_LEVELS);
}

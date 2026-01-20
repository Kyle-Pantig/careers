import {
  STAFF_PERMISSION_LEVELS,
  PERMISSION_LEVEL_INFO,
  type StaffPermissionLevel,
} from '@/shared/validators/permissions';

const API_URL = '/api/proxy';

export interface UserRole {
  id: string;
  permissionLevel: string | null;
  role: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface PermissionLevelsResponse {
  permissionLevels: typeof STAFF_PERMISSION_LEVELS;
  permissionLevelInfo: typeof PERMISSION_LEVEL_INFO;
  allLevels: StaffPermissionLevel[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  contactNumber?: string;
  address?: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string;
  roles: UserRole[];
  _count?: {
    applications: number;
    savedJobs: number;
  };
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  userType?: 'candidates' | 'staff';
}

// Get all users (admin)
export async function getAdminUsers(filters: UserFilters = {}): Promise<UsersResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.search) params.set('search', filters.search);
  if (filters.role) params.set('role', filters.role);
  if (filters.userType) params.set('userType', filters.userType);

  const res = await fetch(`${API_URL}/users/admin?${params}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }

  return res.json();
}

// Get single user
export async function getUser(id: string): Promise<{ user: User }> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch user');
  }

  return result;
}

// Get all roles
export async function getRoles(): Promise<{ roles: Role[] }> {
  const res = await fetch(`${API_URL}/users/roles/all`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch roles');
  }

  return res.json();
}

// Update user role
export async function updateUserRole(
  userId: string,
  roleId: string,
  permissionLevel?: string | null
): Promise<{ user: User; message: string }> {
  const res = await fetch(`${API_URL}/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ roleId, permissionLevel }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to update user role');
  }

  return result;
}

// Toggle user active status
export async function toggleUserActive(userId: string): Promise<{ user: User; message: string }> {
  const res = await fetch(`${API_URL}/users/${userId}/toggle-active`, {
    method: 'PATCH',
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to toggle user status');
  }

  return result;
}

// Get all available permission levels
export async function getAllPermissionLevels(): Promise<PermissionLevelsResponse> {
  const res = await fetch(`${API_URL}/users/permissions/all`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch permission levels');
  }

  return res.json();
}

// Get default permission level for a role
export async function getDefaultPermissionLevel(
  roleName: string
): Promise<{ permissionLevel: string | null }> {
  const res = await fetch(`${API_URL}/users/permissions/defaults/${roleName}`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch default permission level');
  }

  return result;
}

// Update user permission level
export async function updateUserPermissionLevel(
  userId: string,
  permissionLevel: string | null
): Promise<{ user: User; message: string }> {
  const res = await fetch(`${API_URL}/users/${userId}/permissions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ permissionLevel }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to update user permission level');
  }

  return result;
}

// ============================================
// User Invitation Functions
// ============================================

export interface InviteUserData {
  email: string;
  role: 'admin' | 'staff';
  permissionLevel?: string;
}

export interface InviteUserResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// Invite a new user (admin only)
export async function inviteUser(data: InviteUserData): Promise<InviteUserResponse> {
  const res = await fetch(`${API_URL}/auth/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to invite user');
  }

  return result;
}

// Verify invitation token
export interface VerifyInvitationResponse {
  valid: boolean;
  email?: string;
  role?: string;
  error?: string;
}

export async function verifyInvitation(token: string): Promise<VerifyInvitationResponse> {
  const res = await fetch(`${API_URL}/auth/invitation/verify?token=${encodeURIComponent(token)}`, {
    credentials: 'include',
  });

  const result = await res.json();

  // Don't throw error for invalid tokens, return the response
  return result;
}

// Accept invitation and set up account
export interface AcceptInvitationData {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: boolean;
    roles: string[];
  };
}

export async function acceptInvitation(data: AcceptInvitationData): Promise<AcceptInvitationResponse> {
  const res = await fetch(`${API_URL}/auth/invitation/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to accept invitation');
  }

  return result;
}

// Resend invitation (admin only)
export async function resendInvitation(userId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/auth/invitation/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to resend invitation');
  }

  return result;
}

// ============================================
// User Delete Functions
// ============================================

// Delete a user (admin only, super admin required for deleting other admins)
export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to delete user');
  }

  return result;
}

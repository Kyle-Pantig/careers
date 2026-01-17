import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminUsers,
  getRoles,
  updateUserRole,
  toggleUserActive,
  updateUserPermissionLevel,
  type User,
  type Role,
  type UserFilters,
  type UsersResponse,
} from '@/lib/users';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  roles: () => [...userKeys.all, 'roles'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Get all users (admin)
export function useAdminUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => getAdminUsers(filters),
  });
}

// Get all roles
export function useRoles() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: async () => {
      const result = await getRoles();
      return result.roles;
    },
  });
}

// Update user role mutation
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      roleId,
      permissionLevel,
    }: {
      userId: string;
      roleId: string;
      permissionLevel?: string | null;
    }) => updateUserRole(userId, roleId, permissionLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

// Toggle user active status mutation
export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => toggleUserActive(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

// Update user permission level mutation
export function useUpdateUserPermissionLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      permissionLevel,
    }: {
      userId: string;
      permissionLevel: string | null;
    }) => updateUserPermissionLevel(userId, permissionLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

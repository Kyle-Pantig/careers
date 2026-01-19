'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, getCurrentUser, logout as logoutApi } from '@/lib/auth';
import {
  Permission,
  STAFF_PERMISSION_LEVELS,
  hasPermission as checkPermissionLevel,
  canEdit,
  canRead,
} from '@/shared/validators/permissions';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  // New simplified permission checks
  canEdit: boolean;
  canRead: boolean;
  permissionLevel: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await logoutApi();
    // Clear all React Query cache to ensure fresh data for next user
    queryClient.clear();
    // Clear profile completion dismissed flag so it shows for next user
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('profile_completion_dismissed');
    }
    setUser(null);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const isAdmin = user?.roles.includes('admin') ?? false;
  const isStaff = user?.roles.includes('staff') ?? false;
  const isSuperAdmin = user?.isSuperAdmin ?? false;

  // Get the user's permission level
  const permissionLevel = user?.permissionLevel ?? null;

  // Can user edit (full access)?
  const userCanEdit = isAdmin || canEdit(permissionLevel);

  // Can user read (view access)?
  const userCanRead = isAdmin || canRead(permissionLevel);

  // Check if user has a specific permission (backward compatible with legacy permission checks)
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (isAdmin) return true;
    
    // Use the new simplified permission level check
    return checkPermissionLevel(permissionLevel, permission);
  }, [user, isAdmin, permissionLevel]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (isAdmin) return true;
    
    // Check if any permission is granted by the permission level
    return permissions.some((p) => checkPermissionLevel(permissionLevel, p));
  }, [user, isAdmin, permissionLevel]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAdmin, 
        isStaff, 
        isSuperAdmin,
        logout, 
        refreshUser,
        hasPermission,
        hasAnyPermission,
        canEdit: userCanEdit,
        canRead: userCanRead,
        permissionLevel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

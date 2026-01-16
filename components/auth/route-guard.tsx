'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export function RouteGuard({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Check role access if roles specified
    if (allowedRoles.length > 0) {
      const hasAccess = allowedRoles.some((role) => user.roles.includes(role));
      if (!hasAccess) {
        // Redirect based on user role
        if (user.roles.includes('admin') || user.roles.includes('staff')) {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, isLoading, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some((role) => user.roles.includes(role));
    if (!hasAccess) {
      return null;
    }
  }

  return <>{children}</>;
}

// Admin/Staff only guard
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['admin', 'staff']} redirectTo="/login">
      {children}
    </RouteGuard>
  );
}

// Any authenticated user guard
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard redirectTo="/login">
      {children}
    </RouteGuard>
  );
}

// Guest only guard - redirects authenticated users away from auth pages
export function GuestGuard({ 
  children, 
  redirectTo = '/' 
}: { 
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // If user is logged in, redirect them based on their role
    if (user) {
      if (user.roles.includes('admin') || user.roles.includes('staff')) {
        router.push('/dashboard');
      } else {
        router.push(redirectTo);
      }
    }
  }, [user, isLoading, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If user is logged in, don't render the auth page
  if (user) {
    return null;
  }

  return <>{children}</>;
}

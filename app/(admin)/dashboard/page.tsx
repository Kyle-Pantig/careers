'use client';

import { useEffect } from 'react';
import { useBreadcrumbs, useAuth } from '@/context';
import { PERMISSIONS } from '@/shared/validators/permissions';
import { AccessDenied } from '@/components/admin/access-denied';

export default function DashboardPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading } = useAuth();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Admin', href: '/dashboard' },
      { label: 'Dashboard' },
    ]);
  }, [setBreadcrumbs]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!hasPermission(PERMISSIONS.DASHBOARD_VIEW)) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the admin dashboard
        </p>
      </div>
      
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[50vh] flex-1 rounded-xl" />
    </div>
  )
}

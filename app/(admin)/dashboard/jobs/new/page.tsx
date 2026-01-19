'use client';

import { useEffect } from 'react';
import { JobForm } from '@/components/admin';
import { useBreadcrumbs, useAuth } from '@/context';
import { PERMISSIONS } from '@/shared/validators/permissions';
import { AccessDenied } from '@/components/admin/access-denied';

export default function NewJobPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading } = useAuth();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Jobs', href: '/dashboard/jobs' },
      { label: 'New Job' },
    ]);
  }, [setBreadcrumbs]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!hasPermission(PERMISSIONS.JOBS_CREATE)) {
    return <AccessDenied />;
  }

  return <JobForm mode="create" />;
}

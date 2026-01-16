'use client';

import { useEffect } from 'react';
import { JobForm } from '@/components/admin';
import { useBreadcrumbs } from '@/context';

export default function NewJobPage() {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Admin', href: '/dashboard' },
      { label: 'Jobs', href: '/dashboard/jobs' },
      { label: 'New Job' },
    ]);
  }, [setBreadcrumbs]);

  return <JobForm mode="create" />;
}

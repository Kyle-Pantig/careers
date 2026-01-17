'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JobForm } from '@/components/admin';
import { getJob, type Job } from '@/lib/jobs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBreadcrumbs, useAuth } from '@/context';
import { PERMISSIONS } from '@/shared/validators/permissions';
import { AccessDenied } from '@/components/admin/access-denied';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading: authLoading } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const result = await getJob(params.id as string);
        setJob(result.job);
        // Set breadcrumbs with job title
        setBreadcrumbs([
          { label: 'Admin', href: '/dashboard' },
          { label: 'Jobs', href: '/dashboard/jobs' },
          { label: result.job.title },
        ]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Job not found');
        router.push('/dashboard/jobs');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchJob();
    }
  }, [params.id, router, setBreadcrumbs]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasPermission(PERMISSIONS.JOBS_EDIT)) {
    return <AccessDenied />;
  }

  if (!job) {
    return null;
  }

  return <JobForm job={job} mode="edit" />;
}

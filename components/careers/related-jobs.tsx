'use client';

import { useJobs } from '@/hooks';
import { JobCard } from './job-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context';
import { useSavedJobs, useSaveJob, useUnsaveJob, useUserApplications } from '@/hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

interface RelatedJobsProps {
    currentJobId: string;
    industryId: string;
}

export function RelatedJobs({ currentJobId, industryId }: RelatedJobsProps) {
    const router = useRouter();
    const { user } = useAuth();
    const isAdminOrStaff = user?.roles.includes('admin') || user?.roles.includes('staff');
    const [savingJobId, setSavingJobId] = useState<string | null>(null);

    const { data: jobsData, isLoading } = useJobs({
        industryId,
        limit: 5 // Fetch a few more to handle filtering out current job
    });

    const { data: savedJobs = [] } = useSavedJobs(!!user && !isAdminOrStaff);
    const saveJobMutation = useSaveJob();
    const unsaveJobMutation = useUnsaveJob();
    const { data: applicationsData } = useUserApplications(user?.id);

    const savedJobIds = useMemo(() => new Set(savedJobs.map((sj) => sj.job.id)), [savedJobs]);

    const appliedJobsMap = useMemo(() => {
        if (!applicationsData?.applications) return new Map();
        return new Map(
            applicationsData.applications.map((app) => [app.jobId, { id: app.id, status: app.status }])
        );
    }, [applicationsData]);

    const relatedJobs = (jobsData?.jobs || [])
        .filter(job => job.id !== currentJobId)
        .slice(0, 3);

    const handleSaveJob = async (jobId: string, jobNumber: string) => {
        if (!user) {
            router.push(`/login?redirect=/jobs/${jobNumber}`);
            return;
        }

        setSavingJobId(jobId);
        try {
            if (savedJobIds.has(jobId)) {
                await unsaveJobMutation.mutateAsync(jobId);
            } else {
                const result = await saveJobMutation.mutateAsync(jobId);
                if (result.requiresLogin) {
                    router.push(`/login?redirect=/jobs/${jobNumber}`);
                } else {
                    toast.success('Job saved successfully');
                }
            }
        } finally {
            setSavingJobId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="mt-12 border-t pt-12">
                <h2 className="text-2xl font-bold mb-6">Similar Opportunities</h2>
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[300px]" />
                    ))}
                </div>
            </div>
        );
    }

    if (relatedJobs.length === 0) return null;

    return (
        <div className="mt-12 border-t pt-12">
            <h2 className="text-2xl font-bold mb-6">Similar Opportunities</h2>
            <div className="grid gap-6 md:grid-cols-3">
                {relatedJobs.map((job) => {
                    const existingApp = appliedJobsMap.get(job.id);
                    const isRejected = existingApp?.status.toLowerCase() === 'rejected' || existingApp?.status.toLowerCase() === 'not_selected';
                    const hasActiveApp = !!existingApp && !isRejected;

                    return (
                        <JobCard
                            key={job.id}
                            job={job}
                            isSaved={savedJobIds.has(job.id)}
                            isSaving={savingJobId === job.id}
                            onToggleSave={handleSaveJob}
                            isAdminOrStaff={isAdminOrStaff}
                            hasActiveApp={hasActiveApp}
                            applicationId={existingApp?.id}
                        />
                    );
                })}
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context';
import { getUserApplications, type Application } from '@/lib/applications';
import { useSavedJobs, useUnsaveJob } from '@/hooks';
import { MaxWidthLayout } from '@/components/careers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  MapPin,
  Clock,
  Eye,
  Star,
  XCircle,
  UserCheck,
  FileText,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Loader2,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { WORK_TYPE_LABELS, JOB_TYPE_LABELS } from '@/shared/validators';
import type { SavedJob } from '@/lib/saved-jobs';

// Modern status configuration with gradient backgrounds
const STATUS_CONFIG: Record<string, { 
  label: string; 
  icon: React.ReactNode;
  description: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}> = {
  pending: { 
    label: 'Pending', 
    icon: <Clock className="h-3.5 w-3.5" />,
    description: 'Awaiting review',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  reviewed: { 
    label: 'In Review', 
    icon: <Eye className="h-3.5 w-3.5" />,
    description: 'Being reviewed',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
    dotClass: 'bg-blue-500',
  },
  shortlisted: { 
    label: 'Shortlisted', 
    icon: <Star className="h-3.5 w-3.5" />,
    description: 'You\'re shortlisted!',
    bgClass: 'bg-violet-50 dark:bg-violet-950/30',
    textClass: 'text-violet-700 dark:text-violet-400',
    borderClass: 'border-violet-200 dark:border-violet-800',
    dotClass: 'bg-violet-500',
  },
  rejected: { 
    label: 'Closed', 
    icon: <XCircle className="h-3.5 w-3.5" />,
    description: 'Not selected',
    bgClass: 'bg-slate-50 dark:bg-slate-950/30',
    textClass: 'text-slate-600 dark:text-slate-400',
    borderClass: 'border-slate-200 dark:border-slate-700',
    dotClass: 'bg-slate-400',
  },
  hired: { 
    label: 'Hired', 
    icon: <UserCheck className="h-3.5 w-3.5" />,
    description: 'Congratulations!',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
};

function ApplicationCard({ application }: { application: Application }) {
  const status = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;
  const isHired = application.status === 'hired';
  
  return (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 py-0">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Industry Icon */}
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <Link 
              href={`/jobs/${application.job?.jobNumber}`}
              className="block group/link"
            >
              <h3 className="font-semibold text-lg leading-tight group-hover/link:text-primary transition-colors">
                {application.job?.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {application.job?.jobNumber}
              </span>
              {application.job?.industry?.name && (
                <span className="text-xs text-muted-foreground">
                  {application.job.industry.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Applied Time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <Clock className="h-3.5 w-3.5" />
          Applied {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {application.job?.location && (
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <MapPin className="h-3 w-3" />
              {application.job.location}
            </Badge>
          )}
          {application.job?.workType && (
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <Briefcase className="h-3 w-3" />
              {WORK_TYPE_LABELS[application.job.workType as keyof typeof WORK_TYPE_LABELS]}
            </Badge>
          )}
          {application.job?.jobType && (
            <Badge variant="outline" className="text-xs font-normal">
              {JOB_TYPE_LABELS[application.job.jobType as keyof typeof JOB_TYPE_LABELS]}
            </Badge>
          )}
          {/* Status */}
          {isHired ? (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Congratulations! You're hired</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 text-sm ${status.textClass}`}>
              {status.icon}
              <span>{status.description}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-dashed">
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="flex-1 h-9 text-muted-foreground hover:text-foreground rounded-full"
          >
            <Link href={`/jobs/${application.job?.jobNumber}`}>
              View Job
            </Link>
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            asChild 
            className="flex-1 h-9 rounded-full"
          >
            <Link href={`/my-applications/${application.id}`}>
              View Application
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SavedJobCard({ savedJob, onUnsave, isRemoving, appliedJobIds }: { 
  savedJob: SavedJob; 
  onUnsave: (jobId: string) => void;
  isRemoving: boolean;
  appliedJobIds: Map<string, string>;
}) {
  const job = savedJob.job;
  const isExpired = job.expiresAt ? new Date(job.expiresAt) < new Date() : false;
  const isActive = job.isPublished && !isExpired;
  const hasApplied = appliedJobIds.has(job.id);
  
  return (
    <Card className={`py-0 group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 ${
      isActive 
        ? 'bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50' 
        : 'bg-slate-50/50 dark:bg-slate-900/50 opacity-75'
    }`}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Industry Icon */}
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
            isActive 
              ? 'bg-gradient-to-br from-primary/10 to-primary/5' 
              : 'bg-slate-100 dark:bg-slate-800'
          }`}>
            <Building2 className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <Link 
              href={`/jobs/${job.jobNumber}`}
              className="block group/link"
            >
              <h3 className={`font-semibold text-lg leading-tight group-hover/link:text-primary transition-colors ${
                !isActive && 'text-muted-foreground'
              }`}>
                {job.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {job.jobNumber}
              </span>
              {job.industry?.name && (
                <span className="text-xs text-muted-foreground">
                  {job.industry.name}
                </span>
              )}
            </div>
          </div>

          {/* Unsave Button */}
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full flex-shrink-0"
            onClick={() => onUnsave(job.id)}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookmarkCheck className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Saved Time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <Bookmark className="h-3.5 w-3.5 fill-current text-primary" />
          Saved {formatDistanceToNow(new Date(savedJob.savedAt), { addSuffix: true })}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {job.location && (
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <MapPin className="h-3 w-3" />
              {job.location}
            </Badge>
          )}
          {job.workType && (
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <Briefcase className="h-3 w-3" />
              {WORK_TYPE_LABELS[job.workType as keyof typeof WORK_TYPE_LABELS]}
            </Badge>
          )}
          {job.jobType && (
            <Badge variant="outline" className="text-xs font-normal">
              {JOB_TYPE_LABELS[job.jobType as keyof typeof JOB_TYPE_LABELS]}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-dashed">
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="flex-1 h-9 text-muted-foreground hover:text-foreground rounded-full"
          >
            <Link href={`/jobs/${job.jobNumber}`}>
              View Details
            </Link>
          </Button>
          {!isActive ? (
            <Button 
              size="sm" 
              variant="destructive"
              className="flex-1 h-9 rounded-full"
              disabled
            >
              Expired
            </Button>
          ) : hasApplied ? (
            <Button 
              size="sm" 
              variant="secondary"
              asChild 
              className="flex-1 h-9 rounded-full"
            >
              <Link href={`/my-applications/${appliedJobIds.get(job.id)}`}>
                View Application
              </Link>
            </Button>
          ) : (
            <Button 
              size="sm" 
              asChild 
              className="flex-1 h-9 rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              <Link href={`/jobs/${job.jobNumber}/apply`}>
                Apply Now
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="overflow-hidden border-0 shadow-sm">
          <div className="h-10 bg-muted/50" />
          <CardContent className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="flex gap-3 mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [removingJobId, setRemovingJobId] = useState<string | null>(null);
  
  // Get tab from URL query parameter
  const tabFromUrl = searchParams.get('tab');
  const defaultTab = tabFromUrl === 'saved' ? 'saved' : 'applications';

  const isAdminOrStaff = user?.roles.includes('admin') || user?.roles.includes('staff');

  // Redirect to login if not authenticated, or to dashboard if admin/staff
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/my-applications');
    } else if (!authLoading && isAdminOrStaff) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router, isAdminOrStaff]);

  // Fetch applications
  const { data: applicationsData, isLoading: loadingApplications } = useQuery({
    queryKey: ['applications', 'user', user?.id],
    queryFn: () => getUserApplications(user!.id, { limit: 50 }),
    enabled: !!user?.id,
  });

  // Fetch saved jobs - only if user is authenticated
  const { data: savedJobs = [], isLoading: loadingSavedJobs } = useSavedJobs(!!user && !isAdminOrStaff);
  const unsaveJobMutation = useUnsaveJob();

  const applications = applicationsData?.applications || [];
  
  // Get applied job IDs for quick lookup (jobId -> applicationId)
  const appliedJobIds = useMemo(() => {
    return new Map(applications.map((app) => [app.jobId, app.id]));
  }, [applications]);

  const handleUnsaveJob = async (jobId: string) => {
    setRemovingJobId(jobId);
    try {
      await unsaveJobMutation.mutateAsync(jobId);
    } finally {
      setRemovingJobId(null);
    }
  };

  if (authLoading) {
    return (
      <MaxWidthLayout className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MaxWidthLayout>
    );
  }

  if (!user || isAdminOrStaff) {
    return null;
  }

  return (
    <MaxWidthLayout className="py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Jobs</h1>
            <p className="text-muted-foreground mt-1">
              Track your applications and saved positions
            </p>
          </div>
          <Button variant="outline" asChild className="rounded-full w-fit">
            <Link href="/jobs">
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="h-12 p-1 bg-muted/50 rounded-xl w-full max-w-md">
            <TabsTrigger 
              value="applications" 
              className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
            >
              <FileText className="h-4 w-4" />
              <span>Applications</span>
              {applications.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {applications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm h-10"
            >
              <Bookmark className="h-4 w-4" />
              <span>Saved Jobs</span>
              {savedJobs.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {savedJobs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="mt-6">
            {loadingApplications ? (
              <CardsSkeleton />
            ) : applications.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    You haven't applied to any jobs yet. Browse our open positions and find your next opportunity.
                  </p>
                  <Button asChild className="rounded-full bg-gradient-to-r from-primary to-primary/90">
                    <Link href="/jobs">
                      Browse Jobs
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {applications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved Jobs Tab */}
          <TabsContent value="saved" className="mt-6">
            {loadingSavedJobs ? (
              <CardsSkeleton />
            ) : savedJobs.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6">
                    <Bookmark className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Saved Jobs</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    Save jobs you're interested in to easily find them later and track when positions close.
                  </p>
                  <Button asChild className="rounded-full bg-gradient-to-r from-primary to-primary/90">
                    <Link href="/jobs">
                      Browse Jobs
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {savedJobs.map((savedJob) => (
                  <SavedJobCard 
                    key={savedJob.id} 
                    savedJob={savedJob} 
                    onUnsave={handleUnsaveJob}
                    isRemoving={removingJobId === savedJob.job.id}
                    appliedJobIds={appliedJobIds}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MaxWidthLayout>
  );
}

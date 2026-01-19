'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBreadcrumbs, useAuth } from '@/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  Calendar,
  Award,
  Eye,
  EyeOff,
  Pencil,
  DollarSign,
  Hash,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useJobByNumberAdmin, useToggleJobPublish } from '@/hooks';
import { WORK_TYPE_LABELS, JOB_TYPE_LABELS, SHIFT_TYPE_LABELS, CURRENCY_SYMBOLS, SALARY_PERIOD_LABELS, PERMISSIONS } from '@/shared/validators';
import { Badge } from '@/components/ui/badge';
import { AccessDenied } from '@/components/admin/access-denied';

export default function JobPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading: authLoading } = useAuth();

  const jobNumber = params.jobNumber as string;

  // React Query hooks - use admin version to see unpublished jobs
  const { data: job, isLoading, isError } = useJobByNumberAdmin(jobNumber);
  const togglePublishMutation = useToggleJobPublish();

  useEffect(() => {
    if (job) {
      setBreadcrumbs([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Jobs', href: '/dashboard/jobs' },
        { label: `Preview: ${job.jobNumber}` },
      ]);
    }
  }, [job, setBreadcrumbs]);

  useEffect(() => {
    if (isError) {
      toast.error('Job not found');
      router.push('/dashboard/jobs');
    }
  }, [isError, router]);

  const handleTogglePublish = async () => {
    if (!job) return;
    try {
      await togglePublishMutation.mutateAsync(job.id);
      toast.success(job.isPublished ? 'Job unpublished' : 'Job published');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle publish status');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatExperience = (min: number, max: number | null) => {
    if (max) {
      return `${min}-${max} years`;
    }
    if (min > 0) {
      return `${min}+ years`;
    }
    return 'Entry Level';
  };

  const formatSalary = (
    min: number | null, 
    max: number | null, 
    currency: 'USD' | 'EUR' | 'GBP' | 'PHP' | 'JPY' | 'AUD' | 'CAD' | 'SGD' | 'INR' | 'CNY',
    period: 'HOURLY' | 'MONTHLY' | 'YEARLY'
  ) => {
    const symbol = CURRENCY_SYMBOLS[currency];
    const periodLabel = SALARY_PERIOD_LABELS[period];
    if (min && max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()} ${periodLabel}`;
    }
    if (min) {
      return `From ${symbol}${min.toLocaleString()} ${periodLabel}`;
    }
    if (max) {
      return `Up to ${symbol}${max.toLocaleString()} ${periodLabel}`;
    }
    return null;
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!hasPermission(PERMISSIONS.JOBS_VIEW)) {
    return <AccessDenied />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px]" />
          </div>
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/jobs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-muted-foreground">{job.jobNumber}</span>
              {job.isPublished ? (
                <Badge className="bg-green-500/10 text-green-500">Published</Badge>
              ) : (
                <Badge variant="secondary">Draft</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <p className="text-muted-foreground mt-1">
              Preview how this job will appear to applicants
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-14 sm:ml-0">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href={`/dashboard/jobs/${job.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            className="rounded-full"
            variant={job.isPublished ? 'secondary' : 'default'}
            onClick={handleTogglePublish}
            disabled={togglePublishMutation.isPending}
          >
            {job.isPublished ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Job Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Job Description */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Job Description</h2>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none
                  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 first:[&_h1]:mt-0
                  [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 first:[&_h2]:mt-0
                  [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4
                  [&_p]:mb-3 [&_p]:leading-relaxed
                  [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3
                  [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3
                  [&_li]:mb-1
                  [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4
                  [&_hr]:my-6 [&_hr]:border-muted
                  [&_a]:text-primary [&_a]:underline
                  [&_strong]:font-semibold
                  [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 order-1 lg:order-2">
          {/* Job Details Card */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Job Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Job Number</p>
                  <p className="text-sm text-muted-foreground font-mono">{job.jobNumber}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Posted</p>
                  <p className="text-sm text-muted-foreground">
                    {job.publishedAt ? formatDate(job.publishedAt) : 'Not published'}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Industry</p>
                  <p className="text-sm text-muted-foreground">{job.industry?.name || '-'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{job.location}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Work Type</p>
                  <p className="text-sm text-muted-foreground">{WORK_TYPE_LABELS[job.workType]}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Job Type</p>
                  <p className="text-sm text-muted-foreground">{JOB_TYPE_LABELS[job.jobType]}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Shift</p>
                  <p className="text-sm text-muted-foreground">{SHIFT_TYPE_LABELS[job.shiftType]}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Experience</p>
                  <p className="text-sm text-muted-foreground">
                    {formatExperience(job.experienceMin, job.experienceMax)}
                  </p>
                </div>
              </div>
              {(job.salaryMin || job.salaryMax) && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Salary</p>
                      <p className="text-sm text-muted-foreground">
                        {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod)}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {job.expiresAt && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Application Deadline</p>
                      <p className="text-sm text-muted-foreground">{formatDate(job.expiresAt)}</p>
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Views</p>
                  <p className="text-sm text-muted-foreground">{job._count?.views || 0}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Applications</p>
                  <p className="text-sm text-muted-foreground">{job._count?.applications || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useJobByNumber, useCheckJobSaved, useSaveJob, useUnsaveJob } from '@/hooks';
import { useAuth } from '@/context';
import { MaxWidthLayout } from '@/components/careers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  Calendar,
  Award,
  DollarSign,
  Share2,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Hash,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  WORK_TYPE_LABELS,
  JOB_TYPE_LABELS,
  SHIFT_TYPE_LABELS,
  CURRENCY_SYMBOLS,
  SALARY_PERIOD_LABELS,
} from '@/shared/validators';
import { trackJobView } from '@/lib/jobs';
import { checkApplicationStatus } from '@/lib/applications';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const viewTracked = useRef(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Admin/staff cannot save or apply for jobs
  const isAdminOrStaff = user?.roles.includes('admin') || user?.roles.includes('staff');

  const jobNumber = params.jobNumber as string;

  const { data: job, isLoading, isError } = useJobByNumber(jobNumber);
  
  // Saved job functionality
  const { data: isSaved = false } = useCheckJobSaved(job?.id || '');
  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();
  const isSaving = saveJobMutation.isPending || unsaveJobMutation.isPending;

  const handleToggleSave = async () => {
    if (!job) return;
    
    if (!user) {
      // Redirect to login
      router.push(`/login?redirect=/jobs/${jobNumber}`);
      return;
    }
    
    if (isSaved) {
      await unsaveJobMutation.mutateAsync(job.id);
    } else {
      const result = await saveJobMutation.mutateAsync(job.id);
      if (result.requiresLogin) {
        router.push(`/login?redirect=/jobs/${jobNumber}`);
      } else {
        toast.success('Job saved successfully', {
          action: {
            label: 'View Saved Jobs',
            onClick: () => router.push('/my-applications?tab=saved'),
          },
          actionButtonStyle: {
            borderRadius: '9999px',
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
          },
        });
      }
    }
  };

  // Track job view
  useEffect(() => {
    if (job && !viewTracked.current) {
      viewTracked.current = true;
      trackJobView(jobNumber, user?.id || null).catch(() => {
        // Silently fail - view tracking shouldn't block user experience
      });
    }
  }, [job, jobNumber, user?.id]);

  // Check if user has already applied
  useEffect(() => {
    if (job && user) {
      checkApplicationStatus(jobNumber, { userId: user.id })
        .then((result) => {
          setHasApplied(result.hasApplied);
          setApplicationId(result.application?.id || null);
        })
        .catch(() => {
          // Silently fail
        });
    }
  }, [job, jobNumber, user]);

  useEffect(() => {
    if (isError) {
      toast.error('Job not found');
      router.push('/jobs');
    }
  }, [isError, router]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatExperience = (min: number, max: number | null) => {
    if (max) return `${min}-${max} years`;
    if (min > 0) return `${min}+ years`;
    return 'Entry Level';
  };

  const formatSalary = () => {
    if (!job || (!job.salaryMin && !job.salaryMax)) return null;
    const symbol = CURRENCY_SYMBOLS[job.salaryCurrency];
    const period = SALARY_PERIOD_LABELS[job.salaryPeriod];

    if (job.salaryMin && job.salaryMax) {
      return `${symbol}${job.salaryMin.toLocaleString()} - ${symbol}${job.salaryMax.toLocaleString()} ${period}`;
    }
    if (job.salaryMin) {
      return `From ${symbol}${job.salaryMin.toLocaleString()} ${period}`;
    }
    if (job.salaryMax) {
      return `Up to ${symbol}${job.salaryMax.toLocaleString()} ${period}`;
    }
    return null;
  };

  const isJobExpired = job?.expiresAt ? new Date(job.expiresAt) < new Date() : false;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: `Check out this job: ${job?.title}`,
          url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <MaxWidthLayout className="py-8">
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
      </MaxWidthLayout>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <MaxWidthLayout className="py-8">
      {/* Back Button */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all jobs
          </Link>
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div 
        className="mb-8"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="gap-1">
                <Building2 className="h-3 w-3" />
                {job.industry?.name}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{job.title}</h1>
          </motion.div>
          <motion.div 
            className="flex gap-2"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button variant="outline" size="icon" className="rounded-full" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            {/* Save button - hidden for admin/staff */}
            {!isAdminOrStaff && (
              <Button 
                variant={isSaved ? "default" : "outline"} 
                size="icon" 
                className="rounded-full" 
                onClick={handleToggleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSaved ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <motion.div 
          className="lg:col-span-2 space-y-6 order-2 lg:order-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Job Description */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Job Description</h2>
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
        </motion.div>

        {/* Sidebar */}
        <motion.div 
          className="space-y-6 order-1 lg:order-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
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
              {job.publishedAt && (
                <>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Posted</p>
                      <p className="text-sm text-muted-foreground">{formatDate(job.publishedAt)}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
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
                      {user ? (
                        <p className="text-sm text-muted-foreground">{formatSalary()}</p>
                      ) : (
                        <Link 
                          href={`/login?redirect=/jobs/${job.jobNumber}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Login to View Salary
                        </Link>
                      )}
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
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Apply Button - Bottom */}
      {/* Admin/staff can see Expired status but cannot Apply */}
      {(isJobExpired || !isAdminOrStaff) && (
        <motion.div 
          id="apply" 
          className="mt-8 lg:max-w-xs lg:mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {isJobExpired ? (
            <Button 
              variant="destructive"
              className="w-full rounded-full" 
              size="lg"
              disabled
            >
              Expired
            </Button>
          ) : hasApplied && applicationId ? (
            <Button 
              variant="secondary"
              className="w-full rounded-full" 
              size="lg"
              asChild
            >
              <Link href={`/my-applications/${applicationId}`}>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                View Application
              </Link>
            </Button>
          ) : (
            <Button 
              className="w-full rounded-full" 
              size="lg"
              asChild
            >
              <Link href={`/jobs/${jobNumber}/apply`}>
                Apply Now
              </Link>
            </Button>
          )}
        </motion.div>
      )}
    </MaxWidthLayout>
  );
}

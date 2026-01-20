'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context';
import { useApplication } from '@/hooks';
import { MaxWidthLayout } from '@/components/careers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PDFViewer } from '@/components/ui/pdf-viewer';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Calendar,
  User,
  Mail,
  Phone,
  Home,
  FileText,
  ExternalLink,
  CheckCircle2,
  Eye,
  Star,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { WORK_TYPE_LABELS, JOB_TYPE_LABELS } from '@/shared/validators';

// Status configuration
const STATUS_CONFIG: Record<string, { 
  label: string; 
  icon: React.ReactNode;
  description: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  pending: { 
    label: 'Pending Review', 
    icon: <Clock className="h-5 w-5" />,
    description: 'Your application is awaiting review by our team.',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
  reviewed: { 
    label: 'In Review', 
    icon: <Eye className="h-5 w-5" />,
    description: 'Your application is currently being reviewed.',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
  },
  shortlisted: { 
    label: 'Shortlisted', 
    icon: <Star className="h-5 w-5" />,
    description: 'Congratulations! You have been shortlisted for this position.',
    bgClass: 'bg-violet-50 dark:bg-violet-950/30',
    textClass: 'text-violet-700 dark:text-violet-400',
    borderClass: 'border-violet-200 dark:border-violet-800',
  },
  rejected: { 
    label: 'Not Selected', 
    icon: <XCircle className="h-5 w-5" />,
    description: 'Unfortunately, your application was not selected for this position.',
    bgClass: 'bg-slate-50 dark:bg-slate-950/30',
    textClass: 'text-slate-600 dark:text-slate-400',
    borderClass: 'border-slate-200 dark:border-slate-700',
  },
  hired: { 
    label: 'Hired', 
    icon: <UserCheck className="h-5 w-5" />,
    description: 'Congratulations! You have been hired for this position.',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
};

function ApplicationSkeleton() {
  return (
    <MaxWidthLayout className="py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Skeleton className="h-9 w-48" />

        {/* Status Card */}
        <div className="rounded-xl border-2 border-muted p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Job Details Card */}
        <div className="rounded-xl border p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        {/* Timeline Card */}
        <div className="rounded-xl border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>
        </div>

        {/* Your Information Card */}
        <div className="rounded-xl border p-6 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </MaxWidthLayout>
  );
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const applicationId = params.id as string;
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  const { data: application, isLoading, isError } = useApplication(applicationId);

  const isAdminOrStaff = user?.roles.includes('admin') || user?.roles.includes('staff');

  // Redirect to login if not authenticated, or to dashboard if admin/staff
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/my-applications/${applicationId}`);
    } else if (!authLoading && isAdminOrStaff) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router, applicationId, isAdminOrStaff]);

  if (authLoading || isLoading) {
    return <ApplicationSkeleton />;
  }

  if (!user || isAdminOrStaff) {
    return null;
  }

  if (isError || !application) {
    return (
      <MaxWidthLayout className="py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" asChild className="gap-2 -ml-2">
            <Link href="/my-applications">
              <ArrowLeft className="h-4 w-4" />
              Back to My Applications
            </Link>
          </Button>
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Application Not Found</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                This application doesn't exist or you don't have permission to view it.
              </p>
              <Button asChild className="rounded-full">
                <Link href="/my-applications">
                  View My Applications
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MaxWidthLayout>
    );
  }

  const status = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;
  const job = application.job;

  return (
    <MaxWidthLayout className="py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild className="gap-2 -ml-2">
          <Link href="/my-applications">
            <ArrowLeft className="h-4 w-4" />
            Back to My Applications
          </Link>
        </Button>

        {/* Status Card */}
        <Card className={`border ${status.borderClass} ${status.bgClass}`}>
          <CardContent className="py-0">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full ${status.bgClass} ${status.textClass}`}>
                {status.icon}
              </div>
              <div className="flex-1">
                <h2 className={`text-lg font-semibold ${status.textClass}`}>
                  {status.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {status.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Details Card */}
        {job && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                      {job.jobNumber}
                    </span>
                    {job.industry?.name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.industry.name}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="rounded-full">
                  <Link href={`/jobs/${job.jobNumber}`}>
                    View Job
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.location && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </Badge>
                )}
                {job.workType && (
                  <Badge variant="outline" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {WORK_TYPE_LABELS[job.workType as keyof typeof WORK_TYPE_LABELS]}
                  </Badge>
                )}
                {job.jobType && (
                  <Badge variant="outline">
                    {JOB_TYPE_LABELS[job.jobType as keyof typeof JOB_TYPE_LABELS]}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Application Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Application Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(application.createdAt), 'PPP \'at\' p')}
                    <span className="mx-2">·</span>
                    {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {application.updatedAt !== application.createdAt && (
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${status.bgClass}`}>
                    <span className={status.textClass}>{status.icon}</span>
                  </div>
                  <div>
                    <p className="font-medium">Status Updated to {status.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(application.updatedAt), 'PPP \'at\' p')}
                      <span className="mx-2">·</span>
                      {formatDistanceToNow(new Date(application.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Information
            </CardTitle>
            <CardDescription>
              The details you submitted with this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </p>
                <p className="font-medium">{application.firstName} {application.lastName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="font-medium">{application.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Number
                </p>
                <p className="font-medium">{application.contactNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Address
                </p>
                <p className="font-medium">{application.address}</p>
              </div>
            </div>

            {/* Custom Application Fields */}
            {(() => {
              const customFields = (application.job?.customApplicationFields ?? []) as Array<{ key: string; label: string; type: string }>;
              const values = application.customFieldValues || {};
              const fieldsWithValues = customFields.filter((f) => {
                const v = values[f.key];
                return v !== undefined && v !== null && v !== '';
              });
              
              if (fieldsWithValues.length === 0) return null;
              
              return (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">Additional Information</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {fieldsWithValues.map((field) => {
                        const value = values[field.key];
                        return (
                          <div key={field.key} className="space-y-1">
                            <p className="text-sm text-muted-foreground">{field.label}</p>
                            <p className="font-medium break-words">
                              {field.type === 'textarea' ? (
                                <span className="whitespace-pre-wrap">{String(value)}</span>
                              ) : (
                                String(value)
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}

            <Separator className="my-6" />

            {/* Resume Section */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resume
              </p>
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{application.resumeFileName}</p>
                  <p className="text-sm text-muted-foreground">PDF Document</p>
                </div>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setPdfViewerOpen(true)}
                  className="rounded-full gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Resume
                </Button>
              </div>
            </div>

            {/* PDF Viewer Dialog */}
            <PDFViewer
              url={application.resumeUrl}
              fileName={application.resumeFileName}
              open={pdfViewerOpen}
              onOpenChange={setPdfViewerOpen}
            />
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-muted/30">
          <CardContent className="py-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions about your application, please contact our support team.
              </p>
              <Button variant="outline" asChild className="rounded-full">
                <Link href="/jobs">
                  Browse More Jobs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MaxWidthLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBreadcrumbs, useAuth } from '@/context';
import { getAdminApplication, updateApplicationStatus, type Application } from '@/lib/applications';
import { PERMISSIONS } from '@/shared/validators/permissions';
import { AccessDenied } from '@/components/admin/access-denied';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PDFViewer } from '@/components/ui/pdf-viewer';
import { EmailComposeDialog } from '@/components/admin/email-compose-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  Eye,
  Star,
  XCircle,
  UserCheck,
  ExternalLink,
  Download,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

// Status config
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  reviewed: { label: 'Reviewed', variant: 'outline', icon: <Eye className="h-3 w-3" /> },
  shortlisted: { label: 'Shortlisted', variant: 'default', icon: <Star className="h-3 w-3" /> },
  rejected: { label: 'Rejected', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  hired: { label: 'Hired', variant: 'default', icon: <UserCheck className="h-3 w-3" /> },
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const applicationId = params.id as string;

  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['applications', 'admin', applicationId],
    queryFn: () => getAdminApplication(applicationId),
    enabled: !!applicationId,
  });

  const application = data?.application;

  useEffect(() => {
    if (application) {
      setStatus(application.status);
      setNotes(application.notes || '');
      setBreadcrumbs([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Applications', href: '/dashboard/applications' },
        { label: `${application.firstName} ${application.lastName}` },
      ]);
    }
  }, [application, setBreadcrumbs]);

  const updateMutation = useMutation({
    mutationFn: () => updateApplicationStatus(applicationId, { status: status as Application['status'], notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application updated successfully');
    },
    onError: () => {
      toast.error('Failed to update application');
    },
  });

  useEffect(() => {
    if (isError) {
      toast.error('Application not found');
      router.push('/dashboard/applications');
    }
  }, [isError, router]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!hasPermission(PERMISSIONS.APPLICATIONS_VIEW)) {
    return <AccessDenied />;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/applications">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {application.firstName} {application.lastName}
            </h1>
            <p className="text-muted-foreground">
              Applied for {application.job?.title}
            </p>
          </div>
        </div>
        <Badge 
          variant={STATUS_CONFIG[application.status]?.variant || 'secondary'} 
          className={`gap-1 text-sm ${application.status === 'hired' ? 'bg-green-600 hover:bg-green-600/80' : ''}`}
        >
          {STATUS_CONFIG[application.status]?.icon}
          {STATUS_CONFIG[application.status]?.label || application.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${application.email}`} className="font-medium hover:underline">
                      {application.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${application.contactNumber}`} className="font-medium hover:underline">
                      {application.contactNumber}
                    </a>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{application.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume */}
          <Card>
            <CardHeader>
              <CardTitle>Resume</CardTitle>
              <CardDescription>Uploaded resume document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium">{application.resumeFileName}</p>
                    <p className="text-sm text-muted-foreground">PDF Document</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPdfViewerOpen(true)}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PDF Viewer Dialog */}
          <PDFViewer
            url={application.resumeUrl}
            fileName={application.resumeFileName}
            open={pdfViewerOpen}
            onOpenChange={setPdfViewerOpen}
          />

          {/* Job Applied For */}
          <Card>
            <CardHeader>
              <CardTitle>Position Applied For</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{application.job?.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">{application.job?.jobNumber}</span>
                    {application.job?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {application.job.location}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/jobs/preview/${application.job?.jobNumber}`}>
                    View Job
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status - Only for users with edit permission and not hired/rejected */}
          {hasPermission(PERMISSIONS.APPLICATIONS_EDIT) && application.status !== 'hired' && application.status !== 'rejected' && (
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
                <CardDescription>Change the application status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hasPermission(PERMISSIONS.APPLICATIONS_EMAIL) && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setEmailDialogOpen(true)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`tel:${application.contactNumber}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call Applicant
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Email Compose Dialog */}
          <EmailComposeDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            applicationId={application.id}
            applicantName={`${application.firstName} ${application.lastName}`}
            applicantEmail={application.email}
            jobTitle={application.job?.title || ''}
            jobNumber={application.job?.jobNumber || ''}
            jobSalaryMin={application.job?.salaryMin}
            jobSalaryMax={application.job?.salaryMax}
            jobSalaryPeriod={application.job?.salaryPeriod}
            jobSalaryCurrency={application.job?.salaryCurrency}
            applicationStatus={application.status}
          />

          {/* Application Info */}
          <Card className='py-4'>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applied</span>
                <span>{formatDate(application.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(application.updatedAt)}</span>
              </div>
              {application.userId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account</span>
                  <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBreadcrumbs, useAuth } from '@/context';
import { getAdminApplications, updateApplicationStatus, type Application } from '@/lib/applications';
import { PERMISSIONS } from '@/shared/validators/permissions';
import { AccessDenied } from '@/components/admin/access-denied';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PDFViewer } from '@/components/ui/pdf-viewer';
import { EmailComposeDialog } from '@/components/admin/email-compose-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  Mail,
  XCircle,
  Clock,
  Star,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

// Status badge colors
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  reviewed: { label: 'Reviewed', variant: 'outline', icon: <Eye className="h-3 w-3" /> },
  shortlisted: { label: 'Shortlisted', variant: 'default', icon: <Star className="h-3 w-3" /> },
  rejected: { label: 'Rejected', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  hired: { label: 'Hired', variant: 'default', icon: <UserCheck className="h-3 w-3" /> },
};

export default function ApplicationsPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<{ url: string; fileName: string } | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailApplication, setEmailApplication] = useState<Application | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Applications' },
    ]);
  }, [setBreadcrumbs]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!hasPermission(PERMISSIONS.APPLICATIONS_VIEW)) {
    return <AccessDenied />;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'all', { status: statusFilter, search }],
    queryFn: () => getAdminApplications({ status: statusFilter, search, limit: 50 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: Application['status']; notes?: string }) =>
      updateApplicationStatus(id, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application status updated');
      setStatusDialogOpen(false);
      setSelectedApplication(null);
      setNotes('');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const applications: Application[] = data?.applications || [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleStatusChange = (application: Application, status: string) => {
    setSelectedApplication(application);
    setNewStatus(status);
    setNotes(application.notes || '');
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (selectedApplication && newStatus) {
      updateMutation.mutate({
        id: selectedApplication.id,
        status: newStatus as Application['status'],
        notes: notes || undefined,
      });
    }
  };

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    hired: applications.filter(a => a.status === 'hired').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-muted-foreground">Manage job applications from candidates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shortlisted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hired</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No applications found</h3>
              <p className="text-muted-foreground">
                {statusFilter !== 'all' || search
                  ? 'Try adjusting your filters'
                  : 'Applications will appear here when candidates apply'}
              </p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Applicant</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[150px]">Job</TableHead>
                    <TableHead className="hidden lg:table-cell whitespace-nowrap">Applied</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">
                            {application.firstName} {application.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">{application.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[180px]">{application.job?.title}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {application.job?.jobNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell whitespace-nowrap">
                        {formatDate(application.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[application.status]?.variant || 'secondary'} className="gap-1 whitespace-nowrap">
                          {STATUS_CONFIG[application.status]?.icon}
                          <span className="hidden sm:inline">{STATUS_CONFIG[application.status]?.label || application.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/applications/${application.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedResume({
                                  url: application.resumeUrl,
                                  fileName: application.resumeFileName,
                                });
                                setPdfViewerOpen(true);
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View Resume
                            </DropdownMenuItem>
                            {hasPermission(PERMISSIONS.APPLICATIONS_EMAIL) && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEmailApplication(application);
                                  setEmailDialogOpen(true);
                                }}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                            )}
                            {hasPermission(PERMISSIONS.APPLICATIONS_EDIT) && (
                              <>
                                <DropdownMenuSeparator />
                                {/* Status progression: pending → reviewed → shortlisted → hired (one-way) */}
                                {(() => {
                                  const statusOrder = ['pending', 'reviewed', 'shortlisted', 'hired'];
                                  const currentIndex = statusOrder.indexOf(application.status);
                                  const isRejected = application.status === 'rejected';
                                  
                                  return (
                                    <>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(application, 'reviewed')}
                                        disabled={isRejected || currentIndex >= statusOrder.indexOf('reviewed')}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Mark as Reviewed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(application, 'shortlisted')}
                                        disabled={isRejected || currentIndex >= statusOrder.indexOf('shortlisted')}
                                      >
                                        <Star className="mr-2 h-4 w-4" />
                                        Shortlist
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(application, 'hired')}
                                        disabled={isRejected || currentIndex >= statusOrder.indexOf('hired')}
                                      >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Mark as Hired
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(application, 'rejected')}
                                        disabled={isRejected}
                                        className="text-destructive"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                      </DropdownMenuItem>
                                    </>
                                  );
                                })()}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change status for {selectedApplication?.firstName} {selectedApplication?.lastName}'s application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">New Status:</span>
              <Badge variant={STATUS_CONFIG[newStatus]?.variant || 'secondary'} className="gap-1">
                {STATUS_CONFIG[newStatus]?.icon}
                {STATUS_CONFIG[newStatus]?.label || newStatus}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStatusDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmStatusChange}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer */}
      {selectedResume && (
        <PDFViewer
          url={selectedResume.url}
          fileName={selectedResume.fileName}
          open={pdfViewerOpen}
          onOpenChange={(open) => {
            setPdfViewerOpen(open);
            if (!open) setSelectedResume(null);
          }}
        />
      )}

      {/* Email Compose Dialog */}
      {emailApplication && (
        <EmailComposeDialog
          open={emailDialogOpen}
          onOpenChange={(open) => {
            setEmailDialogOpen(open);
            if (!open) setEmailApplication(null);
          }}
          applicationId={emailApplication.id}
          applicantName={`${emailApplication.firstName} ${emailApplication.lastName}`}
          applicantEmail={emailApplication.email}
          jobTitle={emailApplication.job?.title || ''}
          jobNumber={emailApplication.job?.jobNumber || ''}
          jobSalaryMin={emailApplication.job?.salaryMin}
          jobSalaryMax={emailApplication.job?.salaryMax}
          jobSalaryPeriod={emailApplication.job?.salaryPeriod}
          jobSalaryCurrency={emailApplication.job?.salaryCurrency}
        />
      )}
    </div>
  );
}

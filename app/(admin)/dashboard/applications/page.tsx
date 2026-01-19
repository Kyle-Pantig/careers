'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBreadcrumbs, useAuth } from '@/context';
import { getAdminApplications, updateApplicationStatus, type Application } from '@/lib/applications';
import { getAdminIndustries, type Industry } from '@/lib/industries';
import { PERMISSIONS } from '@/shared/validators/permissions';
import { AccessDenied } from '@/components/admin/access-denied';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PDFViewer } from '@/components/ui/pdf-viewer';
import { EmailComposeDialog } from '@/components/admin/email-compose-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Briefcase,
  Building2,
  ChevronRight,
  Filter,
  RefreshCw,
  LayoutGrid,
  List,
} from 'lucide-react';
import { toast } from 'sonner';

// Status badge colors
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-500' },
  reviewed: { label: 'Reviewed', variant: 'outline', icon: <Eye className="h-3 w-3" />, color: 'bg-blue-500' },
  shortlisted: { label: 'Shortlisted', variant: 'default', icon: <Star className="h-3 w-3" />, color: 'bg-purple-500' },
  rejected: { label: 'Rejected', variant: 'destructive', icon: <XCircle className="h-3 w-3" />, color: 'bg-red-500' },
  hired: { label: 'Hired', variant: 'default', icon: <UserCheck className="h-3 w-3" />, color: 'bg-green-500' },
};

export default function ApplicationsPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<{ url: string; fileName: string } | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailApplication, setEmailApplication] = useState<Application | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Applications' },
    ]);
  }, [setBreadcrumbs]);

  // Fetch applications
  const { data: applicationsData, isLoading: applicationsLoading, isFetching, refetch } = useQuery({
    queryKey: ['applications', 'all', { status: statusFilter, search }],
    queryFn: () => getAdminApplications({ status: statusFilter, search, limit: 100 }),
  });

  // Fetch industries
  const { data: industriesData } = useQuery({
    queryKey: ['industries', 'admin'],
    queryFn: getAdminIndustries,
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

  const applications: Application[] = applicationsData?.applications || [];
  const industries: Industry[] = industriesData?.industries || [];

  // Group applications by industry (only applications with an industry)
  const applicationsByIndustry = useMemo(() => {
    const grouped: Record<string, { industry: string; applications: Application[] }> = {};
    
    // Group applications by their job's industry name
    applications.forEach(app => {
      const industryName = app.job?.industry?.name;
      
      // Skip applications without an industry
      if (!industryName) return;
      
      if (!grouped[industryName]) {
        grouped[industryName] = { industry: industryName, applications: [] };
      }
      grouped[industryName].applications.push(app);
    });
    
    // Sort by application count (most applications first)
    return Object.entries(grouped)
      .sort((a, b) => b[1].applications.length - a[1].applications.length);
  }, [applications]);

  // Stats
  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    hired: applications.filter(a => a.status === 'hired').length,
  }), [applications]);

  // Get stats for a specific industry
  const getIndustryStats = (apps: Application[]) => ({
    total: apps.length,
    pending: apps.filter(a => a.status === 'pending').length,
    shortlisted: apps.filter(a => a.status === 'shortlisted').length,
    hired: apps.filter(a => a.status === 'hired').length,
  });

  const formatDate = (date: string) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
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

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!hasPermission(PERMISSIONS.APPLICATIONS_VIEW)) {
    return <AccessDenied />;
  }

  const isLoading = applicationsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground">Manage job applications organized by industry</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
            <p className="text-xs text-muted-foreground">
              Across {applicationsByIndustry.length} industries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting initial review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shortlisted}</div>
            <p className="text-xs text-muted-foreground">Ready for interview</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hired</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hired}</div>
            <p className="text-xs text-muted-foreground">Successfully placed</p>
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
            <Filter className="h-4 w-4 mr-2" />
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

      {/* Applications by Industry */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : applicationsByIndustry.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No applications found</h3>
            <p className="text-muted-foreground">
              {statusFilter !== 'all' || search
                ? 'Try adjusting your filters'
                : 'Applications will appear here when candidates apply'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Applicant</TableHead>
                    <TableHead className="hidden sm:table-cell">Job</TableHead>
                    <TableHead className="hidden lg:table-cell">Industry</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="hidden md:table-cell whitespace-nowrap">Applied</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(application.firstName, application.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[150px]">{application.firstName} {application.lastName}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[150px]">{application.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="min-w-0">
                          <p className="truncate max-w-[200px]">{application.job?.title}</p>
                          <p className="text-sm text-muted-foreground font-mono">{application.job?.jobNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {application.job?.industry?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={STATUS_CONFIG[application.status]?.variant || 'secondary'} 
                          className={`gap-1 ${application.status === 'hired' ? 'bg-green-600 hover:bg-green-600/80' : ''}`}
                        >
                          {STATUS_CONFIG[application.status]?.icon}
                          {STATUS_CONFIG[application.status]?.label || application.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground whitespace-nowrap">
                        {formatDate(application.createdAt)}
                      </TableCell>
                      <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={applicationsByIndustry.slice(0, 3).map(([id]) => id)} className="space-y-4">
          {applicationsByIndustry.map(([industryId, { industry, applications: industryApps }]) => {
            const industryStats = getIndustryStats(industryApps);
            
            return (
              <AccordionItem key={industryId} value={industryId} className="border rounded-lg bg-card">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">{industry}</h3>
                        <p className="text-sm text-muted-foreground">
                          {industryApps.length} applicant{industryApps.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      {industryStats.pending > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {industryStats.pending}
                        </Badge>
                      )}
                      {industryStats.shortlisted > 0 && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" />
                          {industryStats.shortlisted}
                        </Badge>
                      )}
                      {industryStats.hired > 0 && (
                        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-600/80">
                          <UserCheck className="h-3 w-3" />
                          {industryStats.hired}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-4 space-y-3">
                    {industryApps.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(application.firstName, application.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">
                                {application.firstName} {application.lastName}
                              </p>
                              <Badge 
                                variant={STATUS_CONFIG[application.status]?.variant || 'secondary'} 
                                className={`gap-1 ${application.status === 'hired' ? 'bg-green-600 hover:bg-green-600/80' : ''}`}
                              >
                                {STATUS_CONFIG[application.status]?.icon}
                                {STATUS_CONFIG[application.status]?.label || application.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5 flex-wrap">
                              <span className="truncate">{application.email}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {application.job?.title}
                              </span>
                              <span className="hidden md:inline">•</span>
                              <span className="hidden md:inline">{formatDate(application.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                            <Link href={`/dashboard/applications/${application.id}`}>
                              View
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
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
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change status for {selectedApplication?.firstName} {selectedApplication?.lastName}&apos;s application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">New Status:</span>
              <Badge 
                variant={STATUS_CONFIG[newStatus]?.variant || 'secondary'} 
                className={`gap-1 ${newStatus === 'hired' ? 'bg-green-600 hover:bg-green-600/80' : ''}`}
              >
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
          applicationStatus={emailApplication.status}
        />
      )}
    </div>
  );
}

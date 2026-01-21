'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useBreadcrumbs, useAuth } from '@/context';
import { getAdminApplications, updateApplicationStatus, archiveApplication, type Application } from '@/lib/applications';
import { useAdminIndustries } from '@/hooks';
import type { Industry } from '@/lib/industries';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Archive,
  Loader2,
  Check,
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [successId, setSuccessId] = useState<string | null>(null);

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
  const { data: industriesArray } = useAdminIndustries();

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: Application['status']; notes?: string }) =>
      updateApplicationStatus(id, { status, notes }),
    onSuccess: (_, variables) => {
      setSuccessId(variables.id);
      setTimeout(() => setSuccessId(null), 1500);
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

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveApplication(id),
    onSuccess: (_, id) => {
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 1500);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application archived');
    },
    onError: () => {
      toast.error('Failed to archive application');
    },
  });

  const applications: Application[] = applicationsData?.applications || [];
  const industries: Industry[] = industriesArray || [];

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

  // Column definitions for TanStack Table
  const columns = useMemo<ColumnDef<Application>[]>(() => [
    {
      id: 'applicant',
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 hover:bg-transparent -ml-2"
        >
          Applicant
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(row.original.firstName, row.original.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[150px]">{row.original.firstName} {row.original.lastName}</p>
            <p className="text-sm text-muted-foreground truncate max-w-[150px]">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'job',
      accessorFn: (row) => row.job?.title || '',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 hover:bg-transparent -ml-2 hidden sm:flex"
        >
          Job
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate max-w-[200px]">{row.original.job?.title}</p>
          <p className="text-sm text-muted-foreground font-mono">{row.original.job?.jobNumber}</p>
        </div>
      ),
    },
    {
      id: 'industry',
      accessorFn: (row) => row.job?.industry?.name || '',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 hover:bg-transparent -ml-2 hidden lg:flex"
        >
          Industry
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => row.original.job?.industry?.name || 'N/A',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 hover:bg-transparent -ml-2"
        >
          Status
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <Badge
          variant={STATUS_CONFIG[row.original.status]?.variant || 'secondary'}
          className={`gap-1 ${row.original.status === 'hired' ? 'bg-green-600 hover:bg-green-600/80' : ''}`}
        >
          {STATUS_CONFIG[row.original.status]?.icon}
          {STATUS_CONFIG[row.original.status]?.label || row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 hover:bg-transparent -ml-2 hidden md:flex"
        >
          Applied
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>
      ),
      sortingFn: (rowA, rowB) => {
        return new Date(rowA.original.createdAt).getTime() - new Date(rowB.original.createdAt).getTime();
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const application = row.original;
        const statusOrder = ['pending', 'reviewed', 'shortlisted', 'hired'];
        const currentIndex = statusOrder.indexOf(application.status);
        const isRejected = application.status === 'rejected';
        const isProcessing =
          (archiveMutation.isPending && archiveMutation.variables === application.id) ||
          (updateMutation.isPending && selectedApplication?.id === application.id);
        const isSuccess = successId === application.id;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isProcessing || isSuccess}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSuccess ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => archiveMutation.mutate(application.id)}
                    disabled={archiveMutation.isPending}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [hasPermission, archiveMutation, updateMutation, selectedApplication, successId]);

  // TanStack Table instance
  const table = useReactTable({
    data: applications,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
          <div className="flex items-center border rounded-md h-8 p-0.5">
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 rounded-sm"
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 rounded-sm"
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

      {/* Stats Card */}
      <Card className='p-2'>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {/* Total Applications */}
            <div className="p-4 sm:p-6 border-r border-b md:border-b-0 border-border">
              <p className="text-sm text-muted-foreground mb-1">Total Applications</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Across {applicationsByIndustry.length} industries
              </p>
            </div>

            {/* Pending Review */}
            <div className="p-4 sm:p-6 border-b md:border-b-0 md:border-r border-border">
              <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.pending.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Awaiting initial review
              </p>
            </div>

            {/* Shortlisted */}
            <div className="p-4 sm:p-6 border-r md:border-r border-border">
              <p className="text-sm text-muted-foreground mb-1">Shortlisted</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.shortlisted.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Ready for interview
              </p>
            </div>

            {/* Hired */}
            <div className="p-4 sm:p-6">
              <p className="text-sm text-muted-foreground mb-1">Hired</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.hired.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Successfully placed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
        <Card className='py-0'>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table className="min-w-[600px]">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={
                            header.id === 'applicant' ? 'min-w-[180px]' :
                              header.id === 'job' ? 'hidden sm:table-cell' :
                                header.id === 'industry' ? 'hidden lg:table-cell' :
                                  header.id === 'createdAt' ? 'hidden md:table-cell' :
                                    header.id === 'actions' ? 'w-[50px]' : ''
                          }
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={
                            cell.column.id === 'job' ? 'hidden sm:table-cell' :
                              cell.column.id === 'industry' ? 'hidden lg:table-cell' :
                                cell.column.id === 'createdAt' ? 'hidden md:table-cell' : ''
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
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
                <AccordionContent className='py-0'>
                  <div>
                    {industryApps.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 border-b last:border-b-0 bg-muted/30 hover:bg-muted/50 transition-colors"
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
                            <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground mt-1">
                              <li className="truncate">• {application.email}</li>
                              <li className="flex items-center gap-1">
                                <span>•</span>
                                <Briefcase className="h-3 w-3" />
                                <span className="truncate">{application.job?.title}</span>
                              </li>
                              <li className="hidden md:block">• {formatDate(application.createdAt)}</li>
                            </ul>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                            <Link href={`/dashboard/applications/${application.id}`}>
                              View
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                          {(() => {
                            const isProcessing =
                              (archiveMutation.isPending && archiveMutation.variables === application.id) ||
                              (updateMutation.isPending && selectedApplication?.id === application.id);
                            const isSuccess = successId === application.id;

                            return (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isProcessing || isSuccess}>
                                    {isProcessing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isSuccess ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
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
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => archiveMutation.mutate(application.id)}
                                              disabled={archiveMutation.isPending}
                                            >
                                              <Archive className="mr-2 h-4 w-4" />
                                              Archive
                                            </DropdownMenuItem>
                                          </>
                                        );
                                      })()}
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            );
                          })()}
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

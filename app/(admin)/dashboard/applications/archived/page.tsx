'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useBreadcrumbs, useAuth } from '@/context';
import { restoreApplication, deleteApplicationPermanently, type Application } from '@/lib/applications';
import { useArchivedApplications } from '@/hooks';
import { PERMISSIONS } from '@/shared/validators/permissions';
import { AccessDenied } from '@/components/admin/access-denied';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  XCircle,
  Clock,
  Star,
  UserCheck,
  Archive,
  ArchiveRestore,
  Trash2,
  Filter,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
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

export default function ArchivedApplicationsPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Applications', href: '/dashboard/applications' },
      { label: 'Archived' },
    ]);
  }, [setBreadcrumbs]);

  // Fetch archived applications
  const { data: applicationsData, isLoading, isFetching, refetch } = useArchivedApplications({
    status: statusFilter,
    search,
    limit: 100,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application restored');
    },
    onError: () => {
      toast.error('Failed to restore application');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApplicationPermanently(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application permanently deleted');
      setDeleteDialogOpen(false);
      setApplicationToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete application');
    },
  });

  const applications: Application[] = applicationsData?.applications || [];

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleDeleteClick = (application: Application) => {
    setApplicationToDelete(application);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (applicationToDelete) {
      deleteMutation.mutate(applicationToDelete.id);
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
      id: 'archivedAt',
      accessorFn: (row) => row.archivedAt,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 hover:bg-transparent -ml-2 hidden md:flex"
        >
          Archived
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
        <span className="text-muted-foreground whitespace-nowrap">
          {row.original.archivedAt ? formatDate(row.original.archivedAt) : '-'}
        </span>
      ),
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.archivedAt ? new Date(rowA.original.archivedAt).getTime() : 0;
        const dateB = rowB.original.archivedAt ? new Date(rowB.original.archivedAt).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const application = row.original;

        return (
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
              {hasPermission(PERMISSIONS.APPLICATIONS_EDIT) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => restoreMutation.mutate(application.id)}
                    disabled={restoreMutation.isPending}
                  >
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteClick(application)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Permanently
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [hasPermission, restoreMutation]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Archived Applications
            </h1>
            <p className="text-muted-foreground">View and manage archived job applications</p>
          </div>
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

      {/* Archived Applications Table */}
      <Card className='py-0'>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Archive className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No archived applications</h3>
              <p className="text-muted-foreground">
                {statusFilter !== 'all' || search
                  ? 'Try adjusting your filters'
                  : 'Archived applications will appear here'}
              </p>
            </div>
          ) : (
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
                            header.id === 'archivedAt' ? 'hidden md:table-cell' :
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
                            cell.column.id === 'archivedAt' ? 'hidden md:table-cell' : ''
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
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the application from{' '}
              <strong>{applicationToDelete?.firstName} {applicationToDelete?.lastName}</strong>?
              <br /><br />
              This action cannot be undone. All data associated with this application will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

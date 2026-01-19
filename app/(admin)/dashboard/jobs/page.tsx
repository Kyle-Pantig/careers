'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBreadcrumbs, useAuth } from '@/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff,
  Loader2,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminJobs, useDeleteJob, useToggleJobPublish } from '@/hooks';
import { type WorkType } from '@/lib/jobs';
import { WORK_TYPE_LABELS, PERMISSIONS } from '@/shared/validators';
import { AccessDenied } from '@/components/admin/access-denied';

export default function JobsPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [togglingJobId, setTogglingJobId] = useState<string | null>(null);
  const limit = 10;

  // React Query hooks
  const { data, isLoading } = useAdminJobs({
    page,
    limit,
    search: searchQuery || undefined,
    workType: workTypeFilter !== 'all' ? (workTypeFilter as WorkType) : undefined,
    isPublished: publishedFilter !== 'all' ? publishedFilter === 'true' : undefined,
  });

  const deleteMutation = useDeleteJob();
  const togglePublishMutation = useToggleJobPublish();

  const jobs = data?.jobs || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Jobs' },
    ]);
  }, [setBreadcrumbs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(search);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Job deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const handleTogglePublish = async (id: string) => {
    setTogglingJobId(id);
    try {
      await togglePublishMutation.mutateAsync(id);
      toast.success('Job status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle publish status');
    } finally {
      setTogglingJobId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [workTypeFilter, publishedFilter]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!hasPermission(PERMISSIONS.JOBS_VIEW)) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            Manage job postings and their visibility
          </p>
        </div>
{hasPermission(PERMISSIONS.JOBS_CREATE) && (
          <Button asChild>
            <Link href="/dashboard/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter job postings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Work Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={publishedFilter} onValueChange={setPublishedFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Published</SelectItem>
                <SelectItem value="false">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                {hasPermission(PERMISSIONS.JOBS_CREATE) 
                  ? 'Get started by creating your first job posting.'
                  : 'No job postings available.'}
              </p>
              {hasPermission(PERMISSIONS.JOBS_CREATE) && (
                <Button asChild>
                  <Link href="/dashboard/jobs/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Job
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Job</TableHead>
                    <TableHead className="hidden md:table-cell">Industry</TableHead>
                    <TableHead className="hidden lg:table-cell whitespace-nowrap">Location</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="hidden sm:table-cell text-center whitespace-nowrap">Apps</TableHead>
                    <TableHead className="hidden lg:table-cell whitespace-nowrap">Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{job.title}</p>
                          <p className="text-sm text-muted-foreground font-mono">{job.jobNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="truncate max-w-[120px] block">{job.industry?.name || '-'}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="truncate max-w-[150px] block">{job.location}</span>
                      </TableCell>
                      <TableCell>
                        {job.isPublished ? (
                          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 whitespace-nowrap">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="whitespace-nowrap">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center whitespace-nowrap">
                        {job._count?.applications || 0}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell whitespace-nowrap">
                        {formatDate(job.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={togglingJobId === job.id}>
                              {togglingJobId === job.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/jobs/preview/${job.jobNumber}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </Link>
                            </DropdownMenuItem>
                            {hasPermission(PERMISSIONS.JOBS_EDIT) && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/jobs/${job.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {hasPermission(PERMISSIONS.JOBS_PUBLISH) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleTogglePublish(job.id)}
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
                                </DropdownMenuItem>
                              </>
                            )}
                            {hasPermission(PERMISSIONS.JOBS_DELETE) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDelete(job.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} jobs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBreadcrumbs, useAuth } from '@/context';
import { useAdminIndustries, useCreateIndustry, useUpdateIndustry, useDeleteIndustry } from '@/hooks';
import type { Industry } from '@/lib/industries';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { industrySchema, type IndustryFormData, PERMISSIONS } from '@/shared/validators';
import { AccessDenied } from '@/components/admin/access-denied';

export default function IndustriesPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);

  // React Query hooks
  const { data: industries = [], isLoading } = useAdminIndustries();
  const createMutation = useCreateIndustry();
  const updateMutation = useUpdateIndustry();
  const deleteMutation = useDeleteIndustry();

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IndustryFormData>({
    resolver: zodResolver(industrySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  const watchIsActive = watch('isActive');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Admin', href: '/dashboard' },
      { label: 'Industries' },
    ]);
  }, [setBreadcrumbs]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!hasPermission(PERMISSIONS.INDUSTRIES_VIEW)) {
    return <AccessDenied />;
  }

  const openCreateDialog = () => {
    setEditingIndustry(null);
    reset({
      name: '',
      description: '',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (industry: Industry) => {
    setEditingIndustry(industry);
    reset({
      name: industry.name,
      description: industry.description || '',
      isActive: industry.isActive,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: IndustryFormData) => {
    try {
      if (editingIndustry) {
        await updateMutation.mutateAsync({ id: editingIndustry.id, data });
        toast.success('Industry updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Industry created successfully');
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save industry');
    }
  };

  const handleDelete = async () => {
    if (!editingIndustry) return;
    
    try {
      await deleteMutation.mutateAsync(editingIndustry.id);
      toast.success('Industry deleted successfully');
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete industry');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Industries</h1>
          <p className="text-muted-foreground">
            Manage job industries/categories
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {hasPermission(PERMISSIONS.INDUSTRIES_MANAGE) && (
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Industry
              </Button>
            </DialogTrigger>
          )}
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>
                  {editingIndustry ? 'Edit Industry' : 'Add Industry'}
                </DialogTitle>
                <DialogDescription>
                  {editingIndustry
                    ? 'Update the industry details below.'
                    : 'Create a new industry for job postings.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Technology"
                    {...register('name')}
                    disabled={isSaving || isDeleting}
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description..."
                    {...register('description')}
                    disabled={isSaving || isDeleting}
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm">{errors.description.message}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-sm text-muted-foreground">
                      {watchIsActive
                        ? 'Industry is available for selection'
                        : 'Industry is hidden from selection'}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={watchIsActive}
                    onCheckedChange={(checked) => setValue('isActive', checked)}
                    disabled={isSaving || isDeleting}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                {editingIndustry && (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="destructive" 
                          className="w-full sm:w-auto sm:mr-auto"
                          disabled={isSaving || isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Industry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{editingIndustry.name}&quot;? 
                            This action cannot be undone.
                            {editingIndustry._count?.jobs && editingIndustry._count.jobs > 0 && (
                              <span className="block mt-2 text-destructive font-medium">
                                Warning: This industry has {editingIndustry._count.jobs} associated job(s).
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Separator className="sm:hidden" />
                  </>
                )}
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)} 
                    disabled={isSaving || isDeleting}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving || isDeleting} className="flex-1 sm:flex-none">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingIndustry ? 'Save Changes' : 'Create Industry'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Industries Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Industries</CardTitle>
          <CardDescription>
            Industries are used to categorize job postings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : industries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No industries found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first industry.
              </p>
              {hasPermission(PERMISSIONS.INDUSTRIES_MANAGE) && (
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Industry
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Status</TableHead>
                  {hasPermission(PERMISSIONS.INDUSTRIES_MANAGE) && (
                    <TableHead className="w-[70px]"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {industries.map((industry) => (
                  <TableRow key={industry.id}>
                    <TableCell className="font-medium">{industry.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[300px] truncate">
                      {industry.description || '-'}
                    </TableCell>
                    <TableCell>{industry._count?.jobs || 0}</TableCell>
                    <TableCell>
                      {industry.isActive ? (
                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    {hasPermission(PERMISSIONS.INDUSTRIES_MANAGE) && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(industry)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

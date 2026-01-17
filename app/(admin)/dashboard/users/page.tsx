'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/context';
import {
  useAdminUsers,
  useRoles,
  useUpdateUserRole,
  useToggleUserActive,
  useUpdateUserPermissionLevel,
} from '@/hooks';
import { type User } from '@/lib/users';
import {
  STAFF_PERMISSION_LEVELS,
  PERMISSION_LEVEL_INFO,
  PERMISSIONS,
} from '@/shared/validators/permissions';
import { AccessDenied } from '@/components/admin/access-denied';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
  Users,
  ShieldCheck,
  UserCog,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Key,
  Eye,
  Pencil,
  Check,
  Globe,
} from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  staff: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  staff: 'Staff',
  user: 'User',
};

const PERMISSION_LEVEL_BADGES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  [STAFF_PERMISSION_LEVELS.CAN_EDIT]: {
    label: 'Full Access',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: <Pencil className="h-3 w-3" />,
  },
  [STAFF_PERMISSION_LEVELS.CAN_READ]: {
    label: 'View Only',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: <Eye className="h-3 w-3" />,
  },
};

export default function UsersPage() {
  const { user: currentUser, hasPermission, isLoading: authLoading, isAdmin } = useAuth();
  
  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // React Query hooks
  const { data: usersData, isLoading } = useAdminUsers({
    page,
    limit,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  });
  const { data: roles = [] } = useRoles();
  const updateRoleMutation = useUpdateUserRole();
  const toggleActiveMutation = useToggleUserActive();
  const updatePermissionMutation = useUpdateUserPermissionLevel();

  const users = usersData?.users || [];
  const pagination = usersData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // Edit role dialog
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedRolePermission, setSelectedRolePermission] = useState<string>(STAFF_PERMISSION_LEVELS.CAN_READ);

  // Edit permission level dialog
  const [editPermissionOpen, setEditPermissionOpen] = useState(false);
  const [selectedPermissionLevel, setSelectedPermissionLevel] = useState<string>('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  // === PERMISSION HELPER FUNCTIONS ===

  // Check if target user is the same as current user
  const isSelf = (targetUser: User): boolean => {
    return currentUser?.id === targetUser.id;
  };

  // Can current user change this user's role? (ADMIN ONLY)
  const canChangeRole = (targetUser: User): boolean => {
    if (!isAdmin) return false;
    if (isSelf(targetUser)) return false;
    return true;
  };

  // Can current user change this user's permission level? (ADMIN ONLY)
  const canChangePermissionLevel = (targetUser: User): boolean => {
    if (!isAdmin) return false;
    if (targetUser.roles[0]?.role.name !== 'staff') return false;
    return true;
  };

  // Can current user toggle this user's active status? (ADMIN ONLY)
  const canToggleActive = (targetUser: User): boolean => {
    if (!isAdmin) return false;
    if (isSelf(targetUser)) return false;
    return true;
  };

  // Handle role update
  const handleUpdateRole = async () => {
    if (!selectedUser || !selectedRoleId) return;

    try {
      const selectedRole = roles.find((r) => r.id === selectedRoleId);
      // Use selected permission for staff, null for other roles
      const permissionLevel = selectedRole?.name === 'staff' ? selectedRolePermission : null;

      await updateRoleMutation.mutateAsync({
        userId: selectedUser.id,
        roleId: selectedRoleId,
        permissionLevel,
      });
      toast.success('User role updated successfully');
      setEditRoleOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  // Handle toggle active
  const handleToggleActive = async (user: User) => {
    try {
      const result = await toggleActiveMutation.mutateAsync(user.id);
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to toggle user status');
    }
  };

  // Open edit role dialog
  const openEditRole = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleId(user.roles[0]?.role.id || '');
    // Set initial permission level based on current role
    setSelectedRolePermission(user.roles[0]?.permissionLevel || STAFF_PERMISSION_LEVELS.CAN_READ);
    setEditRoleOpen(true);
  };

  // Open edit permission level dialog
  const openEditPermission = (user: User) => {
    setSelectedUser(user);
    setSelectedPermissionLevel(user.roles[0]?.permissionLevel || STAFF_PERMISSION_LEVELS.CAN_READ);
    setEditPermissionOpen(true);
  };

  // Handle permission level update
  const handleUpdatePermissionLevel = async () => {
    if (!selectedUser) return;

    try {
      await updatePermissionMutation.mutateAsync({
        userId: selectedUser.id,
        permissionLevel: selectedPermissionLevel,
      });
      toast.success('Permission level updated successfully');
      setEditPermissionOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update permission level');
    }
  };

  // Get permission level badge for a user
  const getPermissionBadge = (user: User) => {
    const roleName = user.roles[0]?.role.name;
    const permissionLevel = user.roles[0]?.permissionLevel;

    if (roleName === 'admin') {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 gap-1">
          <ShieldCheck className="h-3 w-3" />
          Full Access
        </Badge>
      );
    }

    if (roleName === 'staff') {
      const level = permissionLevel || STAFF_PERMISSION_LEVELS.CAN_READ;
      const info = PERMISSION_LEVEL_BADGES[level];
      if (info) {
        return (
          <Badge variant="secondary" className={`${info.color} gap-1`}>
            {info.icon}
            {info.label}
          </Badge>
        );
      }
    }

    // Regular users - they access the careers page
    if (roleName === 'user') {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 gap-1">
          <Globe className="h-3 w-3" />
          Careers
        </Badge>
      );
    }

    return null;
  };

  // Permission check
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  if (!hasPermission(PERMISSIONS.USERS_VIEW)) {
    return <AccessDenied />;
  }

  // Stats
  const totalUsers = pagination.total;
  const activeUsers = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.roles.some((r) => r.role.name === 'admin')).length;
  const staffCount = users.filter((u) => u.roles.some((r) => r.role.name === 'staff')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Users Management</h1>
        <p className="text-muted-foreground">Manage users, roles, and access levels</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <UserCog className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter || 'all'} onValueChange={(val) => setRoleFilter(val === 'all' ? '' : val)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {ROLE_LABELS[role.name] || role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <ScrollArea className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">User</TableHead>
              <TableHead className="min-w-[100px]">Role</TableHead>
              <TableHead className="min-w-[120px]">Access Level</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell">Verified</TableHead>
              <TableHead className="min-w-[140px] hidden lg:table-cell">Joined</TableHead>
              <TableHead className="min-w-[140px] hidden xl:table-cell">Last Login</TableHead>
              {isAdmin && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  {isAdmin && <TableCell><Skeleton className="h-8 w-8" /></TableCell>}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const canModifyRole = canChangeRole(user);
                const canModifyPermission = canChangePermissionLevel(user);
                const canModifyStatus = canToggleActive(user);
                const hasAnyAction = canModifyRole || canModifyPermission || canModifyStatus;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                          {isSelf(user) && (
                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.roles.map((ur) => (
                        <Badge
                          key={ur.id}
                          variant="secondary"
                          className={ROLE_COLORS[ur.role.name] || ''}
                        >
                          {ROLE_LABELS[ur.role.name] || ur.role.name}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      {getPermissionBadge(user)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={user.emailVerified ? 'default' : 'outline'}>
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {user.lastLoginAt
                        ? format(new Date(user.lastLoginAt), 'MMM d, yyyy h:mm a')
                        : 'Never'}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {hasAnyAction ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canModifyRole && (
                                <DropdownMenuItem onClick={() => openEditRole(user)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Change Role
                                </DropdownMenuItem>
                              )}
                              {canModifyPermission && (
                                <DropdownMenuItem onClick={() => openEditPermission(user)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Set Access Level
                                </DropdownMenuItem>
                              )}
                              {(canModifyRole || canModifyPermission) && canModifyStatus && (
                                <DropdownMenuSeparator />
                              )}
                              {canModifyStatus && (
                                <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                  {user.isActive ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="icon" disabled className="opacity-30">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => p - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRoleId} onValueChange={(value) => {
                setSelectedRoleId(value);
                // Reset permission level to default when role changes
                const role = roles.find((r) => r.id === value);
                if (role?.name === 'staff') {
                  setSelectedRolePermission(STAFF_PERMISSION_LEVELS.CAN_READ);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={ROLE_COLORS[role.name] || ''}
                        >
                          {ROLE_LABELS[role.name] || role.name}
                        </Badge>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">
                            - {role.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show access level options when staff is selected */}
            {roles.find((r) => r.id === selectedRoleId)?.name === 'staff' && (
              <div className="space-y-3">
                <Label>Access Level</Label>
                <RadioGroup
                  value={selectedRolePermission}
                  onValueChange={setSelectedRolePermission}
                  className="space-y-2"
                >
                  {/* Full Access Option */}
                  <div
                    className={`relative flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedRolePermission === STAFF_PERMISSION_LEVELS.CAN_EDIT
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRolePermission(STAFF_PERMISSION_LEVELS.CAN_EDIT)}
                  >
                    <RadioGroupItem
                      value={STAFF_PERMISSION_LEVELS.CAN_EDIT}
                      id="roleCanEdit"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-green-600" />
                        <Label htmlFor="roleCanEdit" className="font-medium cursor-pointer">
                          Full Access
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Can create, edit, delete, and publish content
                      </p>
                    </div>
                  </div>

                  {/* View Only Option */}
                  <div
                    className={`relative flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedRolePermission === STAFF_PERMISSION_LEVELS.CAN_READ
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRolePermission(STAFF_PERMISSION_LEVELS.CAN_READ)}
                  >
                    <RadioGroupItem
                      value={STAFF_PERMISSION_LEVELS.CAN_READ}
                      id="roleCanRead"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-yellow-600" />
                        <Label htmlFor="roleCanRead" className="font-medium cursor-pointer">
                          View Only
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Can only view content, no editing allowed
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Level Dialog */}
      <Dialog open={editPermissionOpen} onOpenChange={setEditPermissionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Access Level</DialogTitle>
            <DialogDescription>
              Choose the access level for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup
              value={selectedPermissionLevel}
              onValueChange={setSelectedPermissionLevel}
              className="space-y-3"
            >
              {/* Full Access Option */}
              <div
                className={`relative flex items-start space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                  selectedPermissionLevel === STAFF_PERMISSION_LEVELS.CAN_EDIT
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedPermissionLevel(STAFF_PERMISSION_LEVELS.CAN_EDIT)}
              >
                <RadioGroupItem
                  value={STAFF_PERMISSION_LEVELS.CAN_EDIT}
                  id="canEdit"
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-green-600" />
                    <Label htmlFor="canEdit" className="font-medium cursor-pointer">
                      {PERMISSION_LEVEL_INFO[STAFF_PERMISSION_LEVELS.CAN_EDIT].label}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {PERMISSION_LEVEL_INFO[STAFF_PERMISSION_LEVELS.CAN_EDIT].description}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                    {PERMISSION_LEVEL_INFO[STAFF_PERMISSION_LEVELS.CAN_EDIT].capabilities.map((cap, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* View Only Option */}
              <div
                className={`relative flex items-start space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                  selectedPermissionLevel === STAFF_PERMISSION_LEVELS.CAN_READ
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedPermissionLevel(STAFF_PERMISSION_LEVELS.CAN_READ)}
              >
                <RadioGroupItem
                  value={STAFF_PERMISSION_LEVELS.CAN_READ}
                  id="canRead"
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-yellow-600" />
                    <Label htmlFor="canRead" className="font-medium cursor-pointer">
                      {PERMISSION_LEVEL_INFO[STAFF_PERMISSION_LEVELS.CAN_READ].label}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {PERMISSION_LEVEL_INFO[STAFF_PERMISSION_LEVELS.CAN_READ].description}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                    {PERMISSION_LEVEL_INFO[STAFF_PERMISSION_LEVELS.CAN_READ].capabilities.map((cap, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-yellow-600" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPermissionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePermissionLevel} disabled={updatePermissionMutation.isPending}>
              {updatePermissionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Access Level'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

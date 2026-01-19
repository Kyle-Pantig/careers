'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteUser } from '@/lib/users';
import { STAFF_PERMISSION_LEVELS } from '@/shared/validators/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  UserCog,
  Loader2,
  Mail,
  Eye,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [permissionLevel, setPermissionLevel] = useState<string>(STAFF_PERMISSION_LEVELS.CAN_READ);

  const inviteMutation = useMutation({
    mutationFn: () => inviteUser({
      email,
      role,
      permissionLevel: role === 'staff' ? permissionLevel : undefined,
    }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setEmail('');
      setRole('staff');
      setPermissionLevel(STAFF_PERMISSION_LEVELS.CAN_READ);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    inviteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite User
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join as an admin or staff member.
            They will receive an email to set up their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Role</Label>
              <RadioGroup
                value={role}
                onValueChange={(value) => setRole(value as 'admin' | 'staff')}
                className="space-y-2"
              >
                {/* Admin Option */}
                <label
                  htmlFor="role-admin"
                  className={`relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    role === 'admin'
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value="admin" id="role-admin" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Administrator</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Full access to all features, can manage users and settings
                    </p>
                  </div>
                </label>

                {/* Staff Option */}
                <label
                  htmlFor="role-staff"
                  className={`relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    role === 'staff'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value="staff" id="role-staff" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Staff Member</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Access to dashboard with configurable permissions
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Permission Level (only for staff) */}
            {role === 'staff' && (
              <div className="space-y-3">
                <Label>Access Level</Label>
                <RadioGroup
                  value={permissionLevel}
                  onValueChange={setPermissionLevel}
                  className="space-y-2"
                >
                  {/* Full Access Option */}
                  <label
                    htmlFor="perm-edit"
                    className={`relative flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      permissionLevel === STAFF_PERMISSION_LEVELS.CAN_EDIT
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem
                      value={STAFF_PERMISSION_LEVELS.CAN_EDIT}
                      id="perm-edit"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Full Access</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Can create, edit, delete, and publish content
                      </p>
                    </div>
                  </label>

                  {/* View Only Option */}
                  <label
                    htmlFor="perm-read"
                    className={`relative flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      permissionLevel === STAFF_PERMISSION_LEVELS.CAN_READ
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem
                      value={STAFF_PERMISSION_LEVELS.CAN_READ}
                      id="perm-read"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">View Only</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Can only view content, no editing allowed
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

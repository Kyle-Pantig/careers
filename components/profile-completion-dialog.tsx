'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context';
import { updateProfile, uploadResume } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2, User, Phone, MapPin, FileText, Upload, X } from 'lucide-react';

const profileCompletionSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  address: z.string().min(1, 'Address is required'),
});

type ProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;

// Session storage key to track if user dismissed the dialog
const DISMISSED_KEY = 'profile_completion_dismissed';

export function ProfileCompletionDialog() {
  const { user, refreshUser, isLoading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileCompletionFormData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      contactNumber: '',
      address: '',
    },
  });

  // Watch form fields for live completion progress
  const watchedFields = watch();

  // Check if profile is incomplete
  const isProfileIncomplete = (u: typeof user) => {
    if (!u) return false;
    // Admin/staff don't need to complete profile
    if (u.roles.includes('admin') || u.roles.includes('staff')) return false;

    return (
      !u.firstName?.trim() ||
      !u.lastName?.trim() ||
      !u.contactNumber?.trim() ||
      !u.address?.trim() ||
      !u.resumeUrl
    );
  };

  // Check if user dismissed the dialog in this session
  const isDismissedThisSession = () => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(DISMISSED_KEY) === 'true';
  };

  // Set up form with existing user data and check if dialog should open
  useEffect(() => {
    if (!authLoading && user && isProfileIncomplete(user) && !isDismissedThisSession()) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        contactNumber: user.contactNumber || '',
        address: user.address || '',
      });
      setOpen(true);
    }
  }, [user, authLoading, reset]);

  const onSubmit = async (data: ProfileCompletionFormData) => {
    setIsSubmitting(true);
    try {
      // Update profile
      await updateProfile(data);

      // Upload resume if selected
      if (selectedFile) {
        await uploadResume(selectedFile);
        setSelectedFile(null);
      }

      toast.success('Profile updated successfully!');
      await refreshUser();

      // Close dialog - it won't reopen if profile is complete
      setOpen(false);
      // Clear the dismissed flag since they completed it
      sessionStorage.removeItem(DISMISSED_KEY);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupLater = () => {
    // Store in session storage so it doesn't show again until next session
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setOpen(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Don't render anything if not needed
  if (!user || !isProfileIncomplete(user)) return null;

  // Calculate completion progress dynamically
  const filledFields = [
    watchedFields.firstName?.trim(),
    watchedFields.lastName?.trim(),
    watchedFields.contactNumber?.trim(),
    watchedFields.address?.trim(),
    user.resumeUrl || selectedFile,
  ].filter(Boolean).length;
  const totalFields = 5;
  const progressPercentage = Math.round((filledFields / totalFields) * 100);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleSetupLater();
    }}>
      <DialogContent className="sm:max-w-lg p-0 flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            To apply for jobs, please complete your profile information. This helps employers learn more about you.
          </DialogDescription>

          {/* Progress Bar in Header */}
          <div className="space-y-2 mt-4 pb-4 border-b">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profile completion</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dialog-firstName"
                    placeholder="John"
                    className="pl-10"
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dialog-lastName"
                    placeholder="Doe"
                    className="pl-10"
                    {...register('lastName')}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Contact Number */}
            <div className="space-y-2">
              <Label htmlFor="dialog-contactNumber">
                Contact Number <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dialog-contactNumber"
                  placeholder="+63 912 345 6789"
                  className="pl-10"
                  {...register('contactNumber')}
                />
              </div>
              {errors.contactNumber && (
                <p className="text-sm text-destructive">{errors.contactNumber.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="dialog-address">
                Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dialog-address"
                  placeholder="123 Main St, City, Country"
                  className="pl-10"
                  {...register('address')}
                />
              </div>
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label>
                Resume <span className="text-destructive">*</span>
              </Label>
              {user.resumeUrl ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm flex-1 truncate">{user.resumeFileName || 'Resume uploaded'}</span>
                  <span className="text-xs text-green-600 font-medium">Uploaded</span>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Drag and drop your resume here, or
                      </p>
                      <label className="cursor-pointer">
                        <span className="text-sm text-primary hover:underline">browse files</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">
                        PDF only, max 5MB
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="text-[10px] text-center text-muted-foreground italic">
              You can always update your profile later from your account settings.
            </p>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="p-6 pt-2 border-t mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleSetupLater}
              className="flex-1"
              disabled={isSubmitting}
            >
              Set up later
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

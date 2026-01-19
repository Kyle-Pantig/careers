'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context';
import { updateProfile, uploadResume, deleteResume, changePassword, getLinkedAccounts, setPassword } from '@/lib/auth';
import { MaxWidthLayout } from '@/components/careers';
import { PDFViewer } from '@/components/ui/pdf-viewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Loader2,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  X,
  Lock,
  Eye,
  EyeOff,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const setPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingResume, setIsDeletingResume] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin/staff don't need contact number, address, or resume
  const isAdminOrStaff = user?.roles.includes('admin') || user?.roles.includes('staff');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      contactNumber: '',
      address: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const {
    register: registerSetPassword,
    handleSubmit: handleSetPasswordSubmit,
    formState: { errors: setPasswordErrors },
    reset: resetSetPassword,
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, authLoading, router]);

  // Populate form with user data
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        contactNumber: user.contactNumber || '',
        address: user.address || '',
      });
    }
  }, [user, reset]);

  // Fetch linked accounts to check if user has credentials
  useEffect(() => {
    if (user) {
      getLinkedAccounts()
        .then((result) => {
          setHasCredentials(result.hasCredentials);
        })
        .catch(() => {
          // If it fails, assume they have credentials (fallback)
          setHasCredentials(true);
        });
    }
  }, [user]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      // First update profile data
      const result = await updateProfile(data);
      
      // Then upload resume if a new file is selected
      if (selectedFile) {
        await uploadResume(selectedFile);
        setSelectedFile(null);
      }
      
      toast.success(result.message);
      // Refresh user data in context
      if (refreshUser) {
        await refreshUser();
      }
      reset(data); // Reset form with new values to clear dirty state
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(result.message);
      resetPassword();
      // Reset password visibility
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onSetPasswordSubmit = async (data: SetPasswordFormData) => {
    setIsSettingPassword(true);
    try {
      const result = await setPassword(data.newPassword);
      toast.success(result.message);
      resetSetPassword();
      // Update hasCredentials state
      setHasCredentials(true);
      // Reset password visibility
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set password');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndSetFile = (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleResumeDelete = async () => {
    if (!user?.resumeUrl) return;
    
    setIsDeletingResume(true);
    try {
      const result = await deleteResume();
      toast.success(result.message);
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete resume');
    } finally {
      setIsDeletingResume(false);
    }
  };

  // Check if there are unsaved changes
  const hasChanges = isDirty || selectedFile !== null;

  if (authLoading) {
    return (
      <MaxWidthLayout className="py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px]" />
        </div>
      </MaxWidthLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MaxWidthLayout className="py-8">
      <motion.div
        className="max-w-2xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Header */}
        <motion.div className="mb-8" variants={fadeInUp} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and account settings.
          </p>
        </motion.div>

        {/* Account Overview Card */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.emailVerified ? (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                      Not Verified
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Completion Progress - Only for non-admin/staff with incomplete profile */}
        {!isAdminOrStaff && (() => {
          const fields = [
            { name: 'First Name', filled: !!user.firstName?.trim() },
            { name: 'Last Name', filled: !!user.lastName?.trim() },
            { name: 'Contact Number', filled: !!user.contactNumber?.trim() },
            { name: 'Address', filled: !!user.address?.trim() },
            { name: 'Resume', filled: !!user.resumeUrl },
          ];
          const filledCount = fields.filter(f => f.filled).length;
          const percentage = Math.round((filledCount / fields.length) * 100);
          const isComplete = percentage === 100;

          if (isComplete) return null;

          return (
            <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.15 }}>
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{percentage}%</span>
                    </div>
                    Complete Your Profile
                  </CardTitle>
                  <CardDescription>
                    A complete profile helps employers learn more about you and increases your chances of getting hired.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Missing Fields */}
                  <div className="flex flex-wrap gap-2">
                    {fields.map((field) => (
                      <div
                        key={field.name}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          field.filled
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {field.filled ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border-2 border-current" />
                        )}
                        {field.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

        {/* Edit Profile Form */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and resume. Click &quot;Save Changes&quot; to apply your updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        className="pl-10"
                        autoComplete="given-name"
                        {...register('firstName')}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        className="pl-10"
                        autoComplete="family-name"
                        {...register('lastName')}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      className="pl-10 bg-muted"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if you need to update your email.
                  </p>
                </div>

                {/* Contact Number - Hidden for admin/staff */}
                {!isAdminOrStaff && (
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactNumber"
                        placeholder="+63 912 345 6789"
                        className="pl-10"
                        autoComplete="tel"
                        {...register('contactNumber')}
                      />
                    </div>
                    {errors.contactNumber && (
                      <p className="text-sm text-destructive">{errors.contactNumber.message}</p>
                    )}
                  </div>
                )}

                {/* Address - Hidden for admin/staff */}
                {!isAdminOrStaff && (
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="Enter your address"
                        className="pl-10"
                        autoComplete="street-address"
                        {...register('address')}
                      />
                    </div>
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address.message}</p>
                    )}
                  </div>
                )}

                {/* Resume Section - Hidden for admin/staff */}
                {!isAdminOrStaff && (
                  <div className="space-y-3">
                    <Label>Resume</Label>
                    <p className="text-xs text-muted-foreground">
                      Upload your resume to auto-fill your details when applying for jobs. PDF only, max 5MB.
                    </p>

                    {/* File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="resume-upload"
                    />
                    
                    {/* Current Resume (if exists and no new file selected) */}
                    {user.resumeUrl && !selectedFile && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.resumeFileName || 'Resume.pdf'}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded {user.resumeUploadedAt 
                                ? new Date(user.resumeUploadedAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })
                                : 'N/A'
                              }
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={isDeletingResume}
                            >
                              {isDeletingResume ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowPdfViewer(true)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Replace
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={handleResumeDelete}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    {/* Selected File Preview (pending upload) */}
                    {selectedFile && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.resumeUrl ? 'Will replace current resume' : 'Ready to upload'} • Click &quot;Save Changes&quot; to confirm
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={handleClearSelectedFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Drag & Drop Zone (only when no resume uploaded and no file selected) */}
                    {!user.resumeUrl && !selectedFile && (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                          ${isDragging 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-medium text-sm">
                              {isDragging ? 'Drop your resume here' : 'Drag & drop or click to select'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF only, max 5MB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Change Selected File Button (when file is selected) */}
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Change Selected File
                      </Button>
                    )}
                  </div>
                )}

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !hasChanges}
                    className="rounded-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Section with Change/Set Password */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasCredentials === null ? (
                // Loading state
                <div className="py-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : hasCredentials ? (
                // User has password - show Change Password
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="change-password" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Lock className="h-4 w-4" />
                        Change Password
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 pt-2">
                        {/* Current Password */}
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? 'text' : 'password'}
                              placeholder="Enter current password"
                              className="pl-10 pr-10"
                              autoComplete="current-password"
                              {...registerPassword('currentPassword')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {passwordErrors.currentPassword && (
                            <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>
                          )}
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="newPassword"
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder="Enter new password"
                              className="pl-10 pr-10"
                              autoComplete="new-password"
                              {...registerPassword('newPassword')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {passwordErrors.newPassword && (
                            <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Password must be at least 8 characters.
                          </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm new password"
                              className="pl-10 pr-10"
                              autoComplete="new-password"
                              {...registerPassword('confirmPassword')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {passwordErrors.confirmPassword && (
                            <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>
                          )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-2">
                          <Button
                            type="submit"
                            disabled={isChangingPassword}
                            className="rounded-full"
                          >
                            {isChangingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Changing...
                              </>
                            ) : (
                              'Change Password'
                            )}
                          </Button>
                        </div>
                      </form>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                // OAuth-only user - show Set Password
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="set-password" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Lock className="h-4 w-4" />
                        Set Password
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="mb-4 p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                          You signed up with Google. Set a password to also log in with your email and password.
                        </p>
                      </div>
                      <form onSubmit={handleSetPasswordSubmit(onSetPasswordSubmit)} className="space-y-4 pt-2">
                        {/* New Password */}
                        <div className="space-y-2">
                          <Label htmlFor="setNewPassword">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="setNewPassword"
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder="Enter password"
                              className="pl-10 pr-10"
                              autoComplete="new-password"
                              {...registerSetPassword('newPassword')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {setPasswordErrors.newPassword && (
                            <p className="text-sm text-destructive">{setPasswordErrors.newPassword.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Password must be at least 8 characters.
                          </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                          <Label htmlFor="setConfirmPassword">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="setConfirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm password"
                              className="pl-10 pr-10"
                              autoComplete="new-password"
                              {...registerSetPassword('confirmPassword')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {setPasswordErrors.confirmPassword && (
                            <p className="text-sm text-destructive">{setPasswordErrors.confirmPassword.message}</p>
                          )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-2">
                          <Button
                            type="submit"
                            disabled={isSettingPassword}
                            className="rounded-full"
                          >
                            {isSettingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Setting...
                              </>
                            ) : (
                              'Set Password'
                            )}
                          </Button>
                        </div>
                      </form>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* PDF Viewer for Resume - Only for non-admin/staff */}
      {!isAdminOrStaff && user.resumeUrl && (
        <PDFViewer
          url={user.resumeUrl}
          fileName={user.resumeFileName || 'Resume.pdf'}
          open={showPdfViewer}
          onOpenChange={setShowPdfViewer}
        />
      )}
    </MaxWidthLayout>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context';
import { useJobByNumber } from '@/hooks';
import { submitApplication, checkApplicationStatus } from '@/lib/applications';
import { MaxWidthLayout } from '@/components/careers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Loader2, 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  ArrowLeft,
  Briefcase,
  MapPin,
  Building2,
  Clock,
} from 'lucide-react';
import { WORK_TYPE_LABELS, JOB_TYPE_LABELS } from '@/shared/validators';

const applicationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  address: z.string().min(1, 'Address is required'),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function JobApplyPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const jobNumber = params.jobNumber as string;

  const { data: job, isLoading: jobLoading, isError } = useJobByNumber(jobNumber);

  // Admin/staff cannot apply for jobs
  const isAdminOrStaff = user?.roles.includes('admin') || user?.roles.includes('staff');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [useProfileResume, setUseProfileResume] = useState(false);
  const [loadingProfileResume, setLoadingProfileResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      address: '',
    },
  });

  // Auto-fill user data when available, clear when logged out
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        contactNumber: user.contactNumber || '',
        address: user.address || '',
      });
      // If user has a saved resume, auto-select to use it
      if (user.resumeUrl && user.resumeFileName) {
        setUseProfileResume(true);
      }
    } else {
      // Clear form when user logs out
      reset({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        address: '',
      });
      setResumeFile(null);
      setUseProfileResume(false);
    }
  }, [user, reset]);

  // Fetch profile resume when user wants to use it
  const fetchProfileResume = async () => {
    if (!user?.resumeUrl) return;
    
    setLoadingProfileResume(true);
    try {
      const response = await fetch(user.resumeUrl);
      const blob = await response.blob();
      const file = new File([blob], user.resumeFileName || 'resume.pdf', { type: 'application/pdf' });
      setResumeFile(file);
      setUseProfileResume(true);
      setResumeError(null);
    } catch {
      setResumeError('Failed to load profile resume. Please upload manually.');
      setUseProfileResume(false);
    } finally {
      setLoadingProfileResume(false);
    }
  };

  // Fetch profile resume when option is selected
  useEffect(() => {
    if (useProfileResume && user?.resumeUrl && !resumeFile) {
      fetchProfileResume();
    }
  }, [useProfileResume, user?.resumeUrl]);

  // Redirect admin/staff away - they cannot apply
  useEffect(() => {
    if (isAdminOrStaff) {
      router.push(`/jobs/${jobNumber}`);
    }
  }, [isAdminOrStaff, router, jobNumber]);

  // Check if user has already applied
  useEffect(() => {
    if (job && user && !isAdminOrStaff) {
      checkApplicationStatus(jobNumber, { userId: user.id })
        .then((result) => {
          setHasApplied(result.hasApplied);
          setApplicationId(result.application?.id || null);
        })
        .catch(() => {})
        .finally(() => setCheckingApplication(false));
    } else if (job) {
      setCheckingApplication(false);
    }
  }, [job, jobNumber, user, isAdminOrStaff]);

  // Redirect if job not found
  useEffect(() => {
    if (isError) {
      toast.error('Job not found');
      router.push('/jobs');
    }
  }, [isError, router]);

  // Check if job is expired
  const isJobExpired = job?.expiresAt ? new Date(job.expiresAt) < new Date() : false;

  // Redirect if job is expired
  useEffect(() => {
    if (job && isJobExpired) {
      toast.error('This job posting has expired');
      router.push(`/jobs/${jobNumber}`);
    }
  }, [job, isJobExpired, router, jobNumber]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setResumeError(null);

    if (!file) {
      setResumeFile(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are allowed');
      setResumeFile(null);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setResumeError('File size must be less than 5MB');
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
    setUseProfileResume(false); // User uploaded a different file
  };

  const removeFile = () => {
    setResumeFile(null);
    setResumeError(null);
    setUseProfileResume(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (!resumeFile) {
      setResumeError('Please upload your resume');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitApplication({
        jobNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        contactNumber: data.contactNumber,
        address: data.address,
        resume: resumeFile,
        userId: user?.id || null,
      });

      setApplicationId(result.application.id);
      setIsSuccess(true);
      toast.success('Application submitted successfully!');
      
      // Invalidate user applications cache so job cards show "View Application" button
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['applications', 'user', user.id] });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin/staff cannot apply - show nothing while redirecting
  if (isAdminOrStaff) {
    return null;
  }

  // Loading state
  if (jobLoading || checkingApplication) {
    return (
      <MaxWidthLayout className="py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
        </div>
      </MaxWidthLayout>
    );
  }

  if (!job) {
    return null;
  }

  // Already applied state
  if (hasApplied) {
    return (
      <MaxWidthLayout className="py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Already Applied</h2>
                <p className="text-muted-foreground mb-6">
                  You have already submitted an application for this position.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" asChild>
                    <Link href={`/jobs/${jobNumber}`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Job
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={applicationId ? `/my-applications/${applicationId}` : '/my-applications'}>
                      View Application
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MaxWidthLayout>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <MaxWidthLayout className="py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Application Submitted!</h2>
                <p className="text-muted-foreground mb-2">
                  Your application for <span className="font-medium">{job.title}</span> has been submitted successfully.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  We'll review your application and get back to you soon.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/jobs">
                      Browse More Jobs
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={applicationId ? `/my-applications/${applicationId}` : '/my-applications'}>
                      View Application
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MaxWidthLayout>
    );
  }

  return (
    <MaxWidthLayout className="py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/jobs/${jobNumber}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Job Details
            </Link>
          </Button>
        </div>

        {/* Job Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Applying for</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold mb-3">{job.title}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {job.industry?.name}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {WORK_TYPE_LABELS[job.workType]}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {JOB_TYPE_LABELS[job.jobType]}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Application</CardTitle>
            <CardDescription>
              {user
                ? 'Please verify your information and upload your resume.'
                : 'Fill in your details and upload your resume to apply.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    {...register('firstName')}
                    disabled={isSubmitting}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    {...register('lastName')}
                    disabled={isSubmitting}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  disabled={isSubmitting || !!user}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
                {user && (
                  <p className="text-xs text-muted-foreground">
                    Email is linked to your account and cannot be changed.
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  autoComplete="tel"
                  {...register('contactNumber')}
                  disabled={isSubmitting}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.contactNumber && (
                  <p className="text-sm text-destructive">{errors.contactNumber.message}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  autoComplete="street-address"
                  {...register('address')}
                  disabled={isSubmitting}
                  placeholder="123 Main St, City, State, ZIP"
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>

              {/* Resume Upload */}
              <div className="space-y-2">
                <Label>Resume (PDF only) *</Label>
                
                {/* Profile Resume Option */}
                {user?.resumeUrl && user?.resumeFileName && !resumeFile && (
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Use resume from profile</p>
                        <p className="text-xs text-muted-foreground truncate">{user.resumeFileName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={fetchProfileResume}
                        disabled={isSubmitting || loadingProfileResume}
                        className="flex-1"
                      >
                        {loadingProfileResume ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Use This Resume'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        Upload Different
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload zone - show if no profile resume or user wants to upload different */}
                {!resumeFile && !user?.resumeUrl && (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 ${
                      resumeError ? 'border-destructive' : 'border-muted-foreground/25'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium mb-1">Click to upload your resume</p>
                    <p className="text-sm text-muted-foreground">PDF only, max 5MB</p>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />

                {/* Selected file display */}
                {resumeFile && (
                  <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{resumeFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        {useProfileResume && ' • From profile'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {resumeError && (
                  <p className="text-sm text-destructive">{resumeError}</p>
                )}
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked === true)}
                  disabled={isSubmitting}
                  className="mt-0.5"
                />
                <label
                  htmlFor="consent"
                  className="text-sm leading-relaxed cursor-pointer select-none"
                >
                  I agree to have my personal information (name, email, contact number, address, and resume) 
                  stored and processed for recruitment purposes. I understand that my data will be 
                  handled in accordance with the privacy policy.
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/jobs/${jobNumber}`)}
                  disabled={isSubmitting}
                  className="sm:flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !consentGiven} 
                  className="sm:flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
              {!user && (
                <p className="text-sm text-center text-muted-foreground pt-3">
                  Want to track your application status?{' '}
                  <Link href={`/login?redirect=/jobs/${jobNumber}/apply`} className="underline hover:text-foreground">
                    Log in
                  </Link>{' '}
                  or{' '}
                  <Link href={`/signup?redirect=/jobs/${jobNumber}/apply`} className="underline hover:text-foreground">
                    create an account
                  </Link>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </MaxWidthLayout>
  );
}

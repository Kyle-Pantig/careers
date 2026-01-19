'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { verifyInvitation, acceptInvitation } from '@/lib/users';
import { useAuth } from '@/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  UserCog,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const acceptInvitationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

export function AcceptInvitationForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
  });

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError('No invitation token provided');
        setIsVerifying(false);
        return;
      }

      try {
        const result = await verifyInvitation(token);
        
        if (result.valid) {
          setIsValid(true);
          setEmail(result.email || '');
          setRole(result.role || '');
        } else {
          setError(result.error || 'Invalid or expired invitation');
        }
      } catch (err) {
        setError('Failed to verify invitation');
      } finally {
        setIsVerifying(false);
      }
    }

    verify();
  }, [token]);

  const onSubmit = async (data: AcceptInvitationFormData) => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      await acceptInvitation({
        token,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });

      setIsSuccess(true);
      toast.success('Account set up successfully!');
      
      // Refresh user context and redirect to dashboard
      await refreshUser();
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to set up account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <div className="flex flex-col items-center gap-2 text-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (!isValid) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Invalid Invitation</h1>
            <p className="text-muted-foreground text-sm mt-2 text-balance">
              {error}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            This invitation may have expired or already been used.
            Please contact your administrator for a new invitation.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome aboard!</h1>
            <p className="text-muted-foreground text-sm mt-2 text-balance">
              Your account has been set up successfully.
            </p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Redirecting you to the dashboard...
          </p>
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Form state
  const roleDisplay = role === 'admin' ? 'Administrator' : 'Staff Member';
  const RoleIcon = role === 'admin' ? Shield : UserCog;
  const roleColor = role === 'admin' 
    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Set Up Your Account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Complete your account setup to get started
          </p>
        </div>

        {/* Invitation Info */}
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            You&apos;ve been invited as
          </p>
          <Badge variant="secondary" className={`${roleColor} gap-1`}>
            <RoleIcon className="h-3 w-3" />
            {roleDisplay}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            {email}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                  disabled={isSubmitting}
                />
                {errors.firstName && (
                  <p className="text-destructive text-sm">{errors.firstName.message}</p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                  disabled={isSubmitting}
                />
                {errors.lastName && (
                  <p className="text-destructive text-sm">{errors.lastName.message}</p>
                )}
              </Field>
            </div>

            {/* Password */}
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password.message}</p>
              )}
            </Field>

            {/* Confirm Password */}
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
              )}
            </Field>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>

            {/* Note */}
            <p className="text-center text-xs text-muted-foreground">
              This is a one-time setup. Make sure to remember your password.
            </p>

            <FieldDescription className="text-center">
              Already have an account?{' '}
              <Link href="/login" className="underline underline-offset-4">
                Log in
              </Link>
            </FieldDescription>
          </div>
        </form>
      </FieldGroup>
    </div>
  );
}

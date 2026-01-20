'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { login, requestMagicLink, CooldownError, googleAuth, GoogleAuthLinkRequired, GoogleAuthResponse } from '@/lib/auth';
import { useAuth } from '@/context';
import { Loader2, Mail, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  loginSchema,
  magicLinkSchema,
  type LoginFormData,
  type MagicLinkFormData
} from '@/shared/validators';
import { useGoogleLogin } from '@react-oauth/google';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const passwordForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const magicLinkForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  });

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const onPasswordSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await login(data);

      // Refresh auth context
      await refreshUser();

      toast.success('Welcome back!');

      // Get redirect URL at submission time (not render time)
      const redirectUrl = searchParams.get('redirect');

      // Redirect to the specified URL or default based on role
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        // Robust role check handling both string[] and object structures
        const roles = (result.user as any).roles || [];
        const userRoles = Array.isArray(roles) ? roles : [];
        const isAdminOrStaff = userRoles.some((r: any) =>
          r === 'admin' || r === 'staff' ||
          r?.name === 'admin' || r?.name === 'staff' ||
          r?.role?.name === 'admin' || r?.role?.name === 'staff'
        );

        if (isAdminOrStaff) {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onMagicLinkSubmit = async (data: MagicLinkFormData) => {
    setIsLoading(true);

    try {
      const result = await requestMagicLink(data.email);
      setMagicLinkSent(true);
      // Set cooldown from server response
      if (result.cooldown) {
        setCooldown(result.cooldown);
      }
      toast.success('Check your inbox for the login link.');
    } catch (err) {
      if (err instanceof CooldownError) {
        setCooldown(err.cooldown);
        toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to send magic link');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendMagicLink = async () => {
    const email = magicLinkForm.getValues('email');
    if (!email) {
      setMagicLinkSent(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = await requestMagicLink(email);
      if (result.cooldown) {
        setCooldown(result.cooldown);
      }
      toast.success('A new login link has been sent to your inbox.');
    } catch (err) {
      if (err instanceof CooldownError) {
        setCooldown(err.cooldown);
        toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to resend magic link');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const result = await googleAuth(tokenResponse.access_token);

        // Check if account linking is required
        if ('requiresLink' in result && result.requiresLink) {
          const linkResult = result as GoogleAuthLinkRequired;
          // Redirect to link account page
          const params = new URLSearchParams({
            token: linkResult.linkToken,
            provider: linkResult.provider,
            name: linkResult.providerName,
            email: linkResult.email,
            googleId: linkResult.googleId,
            redirect: searchParams.get('redirect') || '/',
          });
          router.push(`/auth/link-account?${params.toString()}`);
          return;
        }

        // Success - refresh user and redirect
        const authResult = result as GoogleAuthResponse;
        await refreshUser();
        toast.success('Welcome back!');

        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          // Robust role check
          const roles = (authResult.user as any).roles || [];
          const userRoles = Array.isArray(roles) ? roles : [];
          const isAdminOrStaff = userRoles.some((r: any) =>
            r === 'admin' || r === 'staff' ||
            r?.name === 'admin' || r?.name === 'staff' ||
            r?.role?.name === 'admin' || r?.role?.name === 'staff'
          );

          if (isAdminOrStaff) {
            router.push('/dashboard');
          } else {
            router.push('/');
          }
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error('Google sign-in failed');
    },
  });

  if (magicLinkSent) {
    return (
      <div className={cn('flex flex-col gap-6', className)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-muted-foreground text-sm mt-2 text-balance">
              We&apos;ve sent a sign-in link to your email address. Click the link to sign in.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendMagicLink}
            disabled={isLoading || cooldown > 0}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              'Resend link'
            )}
          </Button>

          <FieldDescription className="text-center">
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() => {
                setMagicLinkSent(false);
                setLoginMethod('password');
              }}
            >
              Log in with password instead
            </button>
          </FieldDescription>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {loginMethod === 'password'
              ? 'Enter your credentials to log in'
              : 'Enter your email to receive a login link'
            }
          </p>
        </div>

        {/* Method Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted">
          <button
            type="button"
            onClick={() => setLoginMethod('password')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              loginMethod === 'password'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <KeyRound className="h-4 w-4" />
            Password
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('magic-link')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              loginMethod === 'magic-link'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Mail className="h-4 w-4" />
            Magic Link
          </button>
        </div>

        {loginMethod === 'password' ? (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} {...props}>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...passwordForm.register('email')}
                  disabled={isLoading}
                />
                {passwordForm.formState.errors.email && (
                  <p className="text-destructive text-sm">{passwordForm.formState.errors.email.message}</p>
                )}
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...passwordForm.register('password')}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.password && (
                  <p className="text-destructive text-sm">{passwordForm.formState.errors.password.message}</p>
                )}
              </Field>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log in
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="magic-email">Email</FieldLabel>
                <Input
                  id="magic-email"
                  type="email"
                  placeholder="m@example.com"
                  {...magicLinkForm.register('email')}
                  disabled={isLoading}
                />
                {magicLinkForm.formState.errors.email && (
                  <p className="text-destructive text-sm">{magicLinkForm.formState.errors.email.message}</p>
                )}
              </Field>

              <Button type="submit" disabled={isLoading || cooldown > 0} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : cooldown > 0 ? (
                  `Wait ${cooldown}s`
                ) : (
                  'Send login link'
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                We&apos;ll send you a secure link to log in without a password.
              </p>
            </div>
          </form>
        )}

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            className="w-full"
            onClick={() => googleLogin()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-2">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline underline-offset-4">
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </div>
  );
}

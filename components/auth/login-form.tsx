'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { login, requestMagicLink, CooldownError } from '@/lib/auth';
import { useAuth } from '@/context';
import { Loader2, Mail, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { 
  loginSchema, 
  magicLinkSchema, 
  type LoginFormData, 
  type MagicLinkFormData 
} from '@/shared/validators';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const router = useRouter();
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
      
      // Redirect based on role
      if (result.user.roles.includes('admin') || result.user.roles.includes('staff')) {
        router.push('/dashboard');
      } else {
        router.push('/');
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
      toast.success('Check your inbox for the sign-in link.');
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
      toast.success('A new sign-in link has been sent to your inbox.');
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
              Sign in with password instead
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
              ? 'Enter your credentials to login'
              : 'Enter your email to receive a sign-in link'
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
                Sign in
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
                  'Send sign-in link'
                )}
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                We&apos;ll send you a secure link to sign in without a password.
              </p>
            </div>
          </form>
        )}

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button variant="outline" type="button" disabled={isLoading} className="w-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-2">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            Continue with GitHub
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

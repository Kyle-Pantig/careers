'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GalleryVerticalEnd, Link2, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription, FieldGroup } from "@/components/ui/field";
import { confirmAccountLink, completeAccountLink } from '@/lib/auth';
import { useAuth } from '@/context';
import { toast } from 'sonner';

function LinkAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const token = searchParams.get('token');
  const provider = searchParams.get('provider');
  const providerName = searchParams.get('name');
  const email = searchParams.get('email');
  const googleId = searchParams.get('googleId');
  const redirect = searchParams.get('redirect') || '/';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email || !googleId) {
      setError('Invalid link request. Please try signing in with Google again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First verify the password
      await confirmAccountLink(token, password);

      // Password verified, now complete the linking
      const result = await completeAccountLink({
        email,
        googleId,
      });

      // Success - refresh user and redirect
      await refreshUser();
      toast.success('Account linked successfully!');

      if (result.user.roles?.includes('admin') || result.user.roles?.includes('staff')) {
        router.push(redirect !== '/' ? redirect : '/dashboard');
      } else {
        router.push(redirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link account');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Redirect to login page
    window.location.href = '/login';
  };

  // If no token provided, show error
  if (!token) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <Link href="/" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              Careers Platform
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Invalid Request</h1>
              <p className="text-muted-foreground mb-6">
                This link is invalid or has expired. Please try signing in with Google again.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <img
            src="/placeholder.svg"
            alt="Image"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Careers Platform
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <FieldGroup>
              <div className="flex flex-col items-center gap-4 text-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Link2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Link your accounts</h1>
                  <p className="text-muted-foreground text-sm mt-2 text-balance">
                    An account with this email already exists. Enter your password to link your {provider === 'google' ? 'Google' : 'OAuth'} account.
                  </p>
                </div>
              </div>

              {providerName && (
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Signing in as: <span className="font-medium text-foreground">{providerName}</span>
                  </p>
                </div>
              )}

              <form onSubmit={handleLinkAccount}>
                <div className="flex flex-col gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <FieldDescription>
                      Enter the password for your existing account
                    </FieldDescription>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        placeholder="Enter your password"
                        className="pr-10"
                        autoFocus
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
                  </Field>

                  {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading || !password} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Link Account & Sign In
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Cancel
                  </Button>

                  <FieldDescription className="text-center">
                    <Link href="/forgot-password" className="underline underline-offset-4">
                      Forgot your password?
                    </Link>
                  </FieldDescription>
                </div>
              </form>
            </FieldGroup>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}

export default function LinkAccountPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LinkAccountForm />
    </Suspense>
  );
}

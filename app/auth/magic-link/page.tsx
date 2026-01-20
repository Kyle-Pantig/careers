'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GalleryVerticalEnd, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifyMagicLink } from '@/lib/auth';
import { useAuth } from '@/context';
import { toast } from 'sonner';

function MagicLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      handleVerification(token);
    } else {
      setStatus('error');
      setMessage('No sign-in token provided.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleVerification = async (verificationToken: string) => {
    try {
      const result = await verifyMagicLink(verificationToken);
      setStatus('success');

      // Refresh auth context
      await refreshUser();

      toast.success('Welcome back!');

      // Redirect based on role
      setTimeout(() => {
        if (result.user.roles.includes('admin') || result.user.roles.includes('staff')) {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }, 1500);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Sign-in failed');
    }
  };

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
            {status === 'loading' && (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Signing you in...</h1>
                <p className="text-muted-foreground">Please wait while we verify your sign-in link.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Sign-in successful!</h1>
                <p className="text-muted-foreground mb-6">Redirecting you now...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Sign-in failed</h1>
                <p className="text-muted-foreground mb-6">{message}</p>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/login">Try signing in again</Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full">
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </>
            )}
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

export default function MagicLinkPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <MagicLinkContent />
    </Suspense>
  );
}

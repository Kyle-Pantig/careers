'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GalleryVerticalEnd, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyEmail, resendVerificationEmail, CooldownError } from '@/lib/auth';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(emailParam || '');
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (token) {
      handleVerification(token);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerification = async (verificationToken: string) => {
    setStatus('loading');
    try {
      const result = await verifyEmail(verificationToken);
      setStatus('success');
      setMessage(result.message);
      toast.success('Email verified successfully!');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    
    setResendLoading(true);
    
    try {
      const result = await resendVerificationEmail(resendEmail);
      if (result.cooldown) {
        setCooldown(result.cooldown);
      }
      toast.success(result.message);
    } catch (err) {
      if (err instanceof CooldownError) {
        setCooldown(err.cooldown);
        toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to resend');
      }
    } finally {
      setResendLoading(false);
    }
  };

  // If there's a token, show verification status
  if (token) {
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
                  <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
                  <p className="text-muted-foreground">Please wait while we verify your email address.</p>
                </>
              )}
              
              {status === 'success' && (
                <>
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Email verified!</h1>
                  <p className="text-muted-foreground mb-6">{message}</p>
                  <Button asChild className="w-full">
                    <Link href="/login">Continue to Login</Link>
                  </Button>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Verification failed</h1>
                  <p className="text-muted-foreground mb-6">{message}</p>
                  <div className="space-y-2">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/signup">Try signing up again</Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full">
                      <Link href="/login">Back to Login</Link>
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

  // No token - show "check your email" message (after signup)
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
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-6">
              We&apos;ve sent a verification link to your email address. 
              Please click the link to verify your account.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder or resend below.
              </p>
              
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  disabled={resendLoading || cooldown > 0}
                />
                <Button 
                  variant="outline" 
                  onClick={handleResend}
                  disabled={resendLoading || !resendEmail || cooldown > 0}
                >
                  {resendLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : cooldown > 0 ? (
                    `${cooldown}s`
                  ) : (
                    'Resend'
                  )}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Already verified?{" "}
                <Link href="/login" className="text-primary underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </div>
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
  )
}

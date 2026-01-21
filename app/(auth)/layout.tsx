import { Suspense } from 'react';
import { GuestGuard } from '@/components/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Authentication",
  description: "Sign in or create an account to manage your job applications.",
  robots: {
    index: false,
    follow: false,
  },
};

function AuthLayoutFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthLayoutFallback />}>
      <GuestGuard redirectTo="/">
        {children}
      </GuestGuard>
    </Suspense>
  );
}

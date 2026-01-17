'use client';

import { Suspense } from 'react';
import { GuestGuard } from '@/components/auth';

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

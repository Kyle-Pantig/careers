'use client';

import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AccessDeniedProps {
  message?: string;
  description?: string;
}

export function AccessDenied({
  message = 'Access Denied',
  description = "You don't have permission to access this page. Please contact your administrator if you believe this is an error.",
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-6">
        <ShieldX className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{message}</h1>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      <Button asChild>
        <Link href="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}

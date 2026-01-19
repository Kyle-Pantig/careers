'use client';

import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleOAuthProvider({ children }: { children: React.ReactNode }) {
  // If no client ID is configured, just render children without Google OAuth
  if (!GOOGLE_CLIENT_ID) {
    return <>{children}</>;
  }

  return (
    <GoogleProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleProvider>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider, QueryProvider, GoogleOAuthProvider } from "@/context";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import { NavigationLoader } from "@/components/navigation-loader";
import { ProfileCompletionDialog } from "@/components/profile-completion-dialog";
import { GoogleAnalytics } from "@/components/shared/google-analytics";
import { CookieConsent } from "@/components/shared/cookie-consent";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Careers Platform | Find Your Next Opportunity",
    template: "%s | Careers Platform"
  },
  description: "Discover exciting career opportunities and join our growing team. Browse available jobs, apply online, and track your applications.",
  keywords: ["jobs", "careers", "employment", "hiring", "recruitment", "job search"],
  authors: [{ name: "Careers Team" }],
  creator: "Careers Platform",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Careers Platform",
    title: "Careers Platform | Find Your Next Opportunity",
    description: "Discover exciting career opportunities and join our growing team. Browse available jobs, apply online, and track your applications.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers Platform | Find Your Next Opportunity",
    description: "Discover exciting career opportunities and join our growing team.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inline CSS loader for page reloads - shows before React hydrates */}
        <style dangerouslySetInnerHTML={{
          __html: `
          #page-loader-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.5);
            z-index: 1030;
            backdrop-filter: blur(1px);
          }
          #page-loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #2563eb 100%);
            background-size: 200% 100%;
            animation: page-loader-animation 1s ease-in-out infinite;
            z-index: 1032;
          }
          /* Ensure nprogress bar is above overlay */
          #nprogress {
            z-index: 1032 !important;
          }
          #nprogress .bar {
            z-index: 1032 !important;
          }
          @keyframes page-loader-animation {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}} />
        <script dangerouslySetInnerHTML={{
          __html: `
          // Create and show loader immediately
          (function() {
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'page-loader-overlay';
            document.documentElement.appendChild(overlay);
            // Create loader bar
            var loader = document.createElement('div');
            loader.id = 'page-loader';
            document.documentElement.appendChild(loader);
            // Remove loader when page is fully loaded
            window.addEventListener('load', function() {
              setTimeout(function() {
                var el = document.getElementById('page-loader');
                var ov = document.getElementById('page-loader-overlay');
                if (el) {
                  el.style.opacity = '0';
                  el.style.transition = 'opacity 0.3s';
                  setTimeout(function() { el.remove(); }, 300);
                }
                if (ov) {
                  ov.style.opacity = '0';
                  ov.style.transition = 'opacity 0.3s';
                  setTimeout(function() { ov.remove(); }, 300);
                }
              }, 100);
            });
            
          })();
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <NextTopLoader
          color="#2563eb"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2563eb,0 0 5px #2563eb"
        />
        <NavigationLoader />
        <QueryProvider>
          <GoogleOAuthProvider>
            <AuthProvider>
              {children}
              <ProfileCompletionDialog />
            </AuthProvider>
          </GoogleOAuthProvider>
        </QueryProvider>
        <CookieConsent />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

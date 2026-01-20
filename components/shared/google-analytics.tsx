'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

// TODO: Replace with your actual measurement ID in .env
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (!GA_MEASUREMENT_ID) {
        return null;
    }

    useEffect(() => {
        // Check if user has already accepted cookies
        const consent = localStorage.getItem('cookie-consent');

        // If accepted, grant consent
        if (consent === 'accepted' && typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted'
            });
        }
    }, []);

    useEffect(() => {
        const url = pathname + searchParams.toString();
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('config', GA_MEASUREMENT_ID, {
                page_path: url,
            });
        }
    }, [pathname, searchParams]);

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // Default consent to denied
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied'
            });

            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
                }}
            />
        </>
    );
}

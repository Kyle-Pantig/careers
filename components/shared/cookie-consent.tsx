'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Small delay for better UX (don't show immediately on load)
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);

        // Grant consent to Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted'
            });
        }
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);

        // Deny consent to Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('consent', 'update', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied'
            });
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg md:bottom-8 lg:left-auto lg:right-8"
                >
                    <Card className="border-zinc-200 bg-white/90 p-4 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-primary/10 p-2 text-primary">
                                    <Cookie className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                                        We value your privacy
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies.{' '}
                                        <Link href="/privacy" className="font-medium text-primary hover:underline">
                                            Read more
                                        </Link>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-end shrink-0 gap-2 sm:flex-row">
                                <Button
                                    variant="outline"
                                    onClick={handleDecline}
                                    className="w-full sm:w-auto"
                                >
                                    Decline
                                </Button>
                                <Button
                                    onClick={handleAccept}
                                    className="w-full sm:w-auto"
                                >
                                    Accept
                                </Button>
                            </div>
                        </div>
                        <button
                            onClick={handleDecline}
                            className="absolute right-2 top-2 rounded-full p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-900 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

'use client';

import Link from 'next/link';
import { Briefcase } from 'lucide-react';

const footerLinks = {
  careers: [
    { name: 'Browse Jobs', href: '/jobs' },
    { name: 'My Applications', href: '/my-applications' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
};

export function CareersFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-zinc-900">
                Careers
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-zinc-600">
              Join our team and be part of something great. Explore open positions and take the next step in your career.
            </p>
          </div>

          {/* Careers Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Careers</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.careers.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Legal</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Careers. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

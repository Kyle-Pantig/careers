'use client';

import Link from 'next/link';
import { MaxWidthLayout } from '@/components/careers';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <MaxWidthLayout>
      <div className="py-12">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-8 -ml-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Last updated: January 19, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-zinc max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              Welcome to Careers. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, disclose, and safeguard your information when 
              you use our career platform and services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              2. Information We Collect
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Personal identification information (name, email address, phone number)</li>
              <li>Professional information (resume, work history, education, skills)</li>
              <li>Account credentials (email and password)</li>
              <li>Application data (job applications, cover letters, responses to questions)</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Process and manage your job applications</li>
              <li>Create and maintain your account</li>
              <li>Communicate with you about job opportunities and application status</li>
              <li>Improve our platform and services</li>
              <li>Comply with legal obligations</li>
              <li>Protect against fraudulent or unauthorized activity</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              4. Information Sharing
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Hiring managers and recruiters reviewing your applications</li>
              <li>Service providers who assist in operating our platform</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p className="text-zinc-600 leading-relaxed mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              5. Data Security
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data 
              against unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
              secure servers, and regular security assessments.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              6. Data Retention
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              We retain your personal data for as long as necessary to fulfill the purposes outlined in this 
              policy, unless a longer retention period is required by law. You may request deletion of your 
              account and associated data at any time.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              7. Your Rights
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              8. Cookies and Tracking
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience on our platform. 
              These help us understand how you use our services, remember your preferences, and improve 
              functionality. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage 
              you to review this policy periodically.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              10. Contact Us
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
              <p className="text-zinc-700">
                <strong>Email:</strong> privacy@careers.com
              </p>
            </div>
          </section>
        </div>
      </div>
    </MaxWidthLayout>
  );
}

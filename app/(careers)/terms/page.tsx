'use client';

import Link from 'next/link';
import { MaxWidthLayout } from '@/components/careers';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Last updated: January 19, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-zinc max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              By accessing or using the Careers platform, you agree to be bound by these Terms of Service
              and all applicable laws and regulations. If you do not agree with any of these terms, you
              are prohibited from using or accessing this platform.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              2. Use of Service
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              You agree to use the Careers platform only for lawful purposes and in accordance with these
              Terms. You agree not to:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Use the platform in any way that violates any applicable law or regulation</li>
              <li>Provide false, inaccurate, or misleading information</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the platform or servers</li>
              <li>Attempt to gain unauthorized access to any part of the platform</li>
              <li>Use automated systems to access the platform without permission</li>
              <li>Harass, abuse, or harm another person through the platform</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              3. Account Responsibilities
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              When you create an account with us, you must:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
            <p className="text-zinc-600 leading-relaxed mt-4">
              We reserve the right to suspend or terminate accounts that violate these terms or engage
              in fraudulent activity.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              4. Job Applications
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              When submitting job applications through our platform:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>You certify that all information provided is true and accurate</li>
              <li>You understand that submitting an application does not guarantee employment</li>
              <li>You consent to the review of your application by hiring personnel</li>
              <li>You agree that we may contact you regarding your application status</li>
              <li>You acknowledge that application decisions are at the sole discretion of the employer</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              5. Intellectual Property
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              The Careers platform and its original content, features, and functionality are owned by us
              and are protected by international copyright, trademark, and other intellectual property laws.
              You may not reproduce, distribute, modify, or create derivative works without our prior
              written consent.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              6. User Content
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              By submitting content to our platform (including resumes, cover letters, and other materials),
              you grant us a non-exclusive, worldwide, royalty-free license to use, store, and process that
              content for the purpose of providing our services. You retain ownership of your content and
              may delete it at any time.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              7. Privacy
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              Your use of the platform is also governed by our{' '}
              <Link href="/privacy" className="text-zinc-900 underline hover:text-zinc-700">
                Privacy Policy
              </Link>
              , which describes how we collect, use, and protect your personal information. By using the
              platform, you consent to the practices described in the Privacy Policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              8. Disclaimers
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We make no warranties,
              expressed or implied, regarding:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>The accuracy or completeness of any information on the platform</li>
              <li>The availability or uninterrupted operation of the platform</li>
              <li>The results that may be obtained from using the platform</li>
              <li>The security of the platform or freedom from viruses or harmful components</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not limited to loss of profits,
              data, or other intangible losses, resulting from your use of or inability to use the platform.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              10. Indemnification
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              You agree to indemnify and hold us harmless from any claims, damages, losses, or expenses
              (including legal fees) arising from your use of the platform, violation of these terms, or
              infringement of any rights of another party.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              11. Modifications to Terms
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective
              immediately upon posting to the platform. Your continued use of the platform after any changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              12. Termination
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              We may terminate or suspend your access to the platform immediately, without prior notice or
              liability, for any reason, including breach of these Terms. Upon termination, your right to
              use the platform will cease immediately.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              13. Governing Law
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, without
              regard to conflict of law principles. Any disputes arising from these terms shall be resolved
              through appropriate legal channels.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              14. Contact Us
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
              <p className="text-zinc-700">
                <strong>Email:</strong> buildwithkyle@kylepantig.site
              </p>
            </div>
          </section>
        </div>
      </div>
    </MaxWidthLayout>
  );
}

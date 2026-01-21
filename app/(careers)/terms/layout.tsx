import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Read our terms of service to understand the rules and guidelines for using our Careers Platform.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

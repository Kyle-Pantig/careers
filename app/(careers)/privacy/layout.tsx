import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Learn about how we collect, use, and protect your personal information on our Careers Platform.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

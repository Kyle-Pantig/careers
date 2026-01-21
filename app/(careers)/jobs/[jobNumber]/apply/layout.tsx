import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Apply for Job",
    description: "Complete your application for this position.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

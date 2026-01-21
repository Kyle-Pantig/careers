import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "My Applications",
    description: "Track and manage your job applications and saved positions.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function MyApplicationsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

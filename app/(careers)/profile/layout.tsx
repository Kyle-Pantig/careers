import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "My Profile",
    description: "Manage your professional profile and resume.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

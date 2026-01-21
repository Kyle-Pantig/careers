import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Browse Jobs",
    description: "Explore all open positions at our company. Filter by industry, work type, and location to find the right fit for you.",
    openGraph: {
        title: "Browse Jobs | Careers Platform",
        description: "Explore all open positions at our company. Filter by industry, work type, and location to find the right fit for you.",
        url: "/jobs",
    },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

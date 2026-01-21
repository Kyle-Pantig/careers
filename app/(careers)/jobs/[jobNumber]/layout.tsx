import { Metadata } from 'next';
import { getJobByNumber } from '@/lib/jobs';

type Props = {
    params: Promise<{ jobNumber: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { jobNumber } = await params;

    try {
        const result = await getJobByNumber(jobNumber);
        const job = result.job;

        if (!job) {
            return {
                title: "Job Not Found",
            };
        }

        const title = `${job.title} | ${job.industry?.name || 'Careers'}`;
        const description = `${job.title} position in ${job.location}. ${job.workType} role. Apply now on our Careers Platform.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'article',
                url: `/jobs/${jobNumber}`,
                images: [
                    {
                        url: "/og-image.png", // Could be dynamic if we had job-specific images
                        width: 1200,
                        height: 630,
                        alt: job.title,
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
            },
        };
    } catch (error) {
        return {
            title: "Job Opportunity",
        };
    }
}

export default function JobDetailLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

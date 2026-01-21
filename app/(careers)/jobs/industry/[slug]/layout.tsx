import { Metadata } from 'next';
import { getIndustries } from '@/lib/industries';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    try {
        const result = await getIndustries();
        const industry = result.industries.find((i: any) =>
            i.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
        );

        if (!industry) {
            return {
                title: "Industry Jobs",
            };
        }

        const title = `${industry.name} Jobs | Careers Platform`;
        const description = `Explore exciting career opportunities in the ${industry.name} industry. Find your next job and apply today.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                url: `/jobs/industry/${slug}`,
            },
        };
    } catch (error) {
        return {
            title: "Industry Jobs",
        };
    }
}

export default function IndustryLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

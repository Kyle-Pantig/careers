import { MetadataRoute } from 'next';
import { getJobs } from '@/lib/jobs';
import { getIndustries } from '@/lib/industries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Base routes
    const routes = [
        '',
        '/jobs',
        '/privacy',
        '/terms',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    try {
        // Dynamic job routes
        const { jobs = [] } = await getJobs({ limit: 1000 });
        const jobRoutes = jobs.map((job) => ({
            url: `${baseUrl}/jobs/${job.jobNumber}`,
            lastModified: new Date(job.updatedAt || job.publishedAt || new Date()),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));

        // Dynamic industry routes
        const { industries = [] } = await getIndustries();
        const industryRoutes = industries.map((industry: any) => ({
            url: `${baseUrl}/jobs/industry/${encodeURIComponent(industry.name.toLowerCase().replace(/\s+/g, '-'))}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));

        return [...routes, ...jobRoutes, ...industryRoutes];
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return routes;
    }
}

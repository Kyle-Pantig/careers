import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/', // Admin area
                '/profile/',   // User profile
                '/my-applications/', // User applications
                '/api/',       // API routes
                '/login',
                '/register',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}

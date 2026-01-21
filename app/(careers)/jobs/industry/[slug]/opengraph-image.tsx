import { ImageResponse } from 'next/og';
import { getIndustries } from '@/lib/industries';

export const alt = 'Industry Jobs';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
    const { slug } = params;
    let industryName = 'Industry Jobs';

    try {
        const result = await getIndustries();
        const industry = result.industries.find((i: any) =>
            i.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
        );
        if (industry) {
            industryName = `${industry.name} Jobs`;
        }
    } catch (error) {
        console.error('Error fetching industry for OG image:', error);
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0f172a',
                    padding: '80px',
                    color: 'white',
                    position: 'relative',
                }}
            >
                {/* Abstract Background Gradient */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(30, 64, 175, 0.4) 0%, transparent 50%)',
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#2563eb',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '32px',
                        }}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M3 21h18" />
                            <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3" />
                            <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
                            <path d="M19 14v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1" />
                        </svg>
                    </div>

                    <p style={{ fontSize: '24px', fontWeight: '500', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                        Browse Categories
                    </p>

                    <h1
                        style={{
                            fontSize: '84px',
                            fontWeight: '800',
                            lineHeight: '1',
                            marginBottom: '32px',
                            maxWidth: '900px',
                        }}
                    >
                        {industryName}
                    </h1>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontSize: '24px',
                            color: '#cbd5e1',
                        }}
                    >
                        Find your next career step in {industryName.replace(' Jobs', '')}
                    </div>
                </div>

                <div
                    style={{
                        position: 'absolute',
                        bottom: '40px',
                        fontSize: '20px',
                        color: '#64748b',
                    }}
                >
                    Careers Platform • Build the future
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}

import { ImageResponse } from 'next/og';
import { getJobByNumber } from '@/lib/jobs';

export const alt = 'Job Opportunity';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { jobNumber: string } }) {
    const { jobNumber } = params;
    let jobTitle = 'Job Opportunity';
    let industry = 'Careers';
    let location = 'Remote / On-site';
    let workType = 'Full-time';

    try {
        // We add a cache header if needed, but Next.js handles this
        const result = await getJobByNumber(jobNumber);
        if (result?.job) {
            jobTitle = result.job.title;
            industry = result.job.industry?.name || 'Careers';
            location = result.job.location;
            workType = result.job.workType;
        }
    } catch (error) {
        console.error('Error fetching job for OG image:', error);
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                    backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    padding: '60px',
                    color: 'white',
                    position: 'relative',
                }}
            >
                {/* Decorative Grid Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.1,
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px',
                    }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', zIndex: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                padding: '8px 16px',
                                borderRadius: '50px',
                                width: 'fit-content',
                                marginBottom: '24px',
                                fontSize: '20px',
                                fontWeight: '600',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                            }}
                        >
                            🚀 WE ARE HIRING
                        </div>

                        <h1
                            style={{
                                fontSize: '72px',
                                fontWeight: '800',
                                lineHeight: '1.1',
                                marginBottom: '20px',
                                maxWidth: '900px',
                                textShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                        >
                            {jobTitle}
                        </h1>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', opacity: 0.9 }}>
                                <span style={{ fontSize: '28px' }}>📍</span> {location}
                            </div>
                            <div style={{ fontSize: '24px', opacity: 0.5 }}>|</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', opacity: 0.9 }}>
                                <span style={{ fontSize: '28px' }}>🏢</span> {industry}
                            </div>
                            <div style={{ fontSize: '24px', opacity: 0.5 }}>|</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', opacity: 0.9 }}>
                                <span style={{ fontSize: '28px' }}>💼</span> {workType}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                            paddingTop: '32px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{ width: '24px', height: '24px', backgroundColor: '#2563eb', borderRadius: '4px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '22px', fontWeight: '700' }}>Careers Platform</div>
                                <div style={{ fontSize: '16px', opacity: 0.7 }}>Join our team today</div>
                            </div>
                        </div>

                        <div
                            style={{
                                backgroundColor: 'white',
                                color: '#2563eb',
                                padding: '12px 32px',
                                borderRadius: '50px',
                                fontSize: '22px',
                                fontWeight: '700',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            }}
                        >
                            Apply Now
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}

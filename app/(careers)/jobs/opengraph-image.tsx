import { ImageResponse } from 'next/og';

export const alt = 'Browse Jobs';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default function Image() {
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
                    backgroundColor: '#fff',
                    // Subtle grid pattern background
                    backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    padding: '80px',
                    position: 'relative',
                }}
            >
                {/* Abstract shapes */}
                <div
                    style={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: 'linear-gradient(to bottom left, #dbeafe, transparent)',
                        zIndex: 0,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -50,
                        left: -50,
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: 'linear-gradient(to top right, #dbeafe, transparent)',
                        zIndex: 0,
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        zIndex: 10,
                    }}
                >
                    {/* Icon */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 80,
                            height: 80,
                            backgroundColor: '#eff6ff',
                            borderRadius: '50%',
                            marginBottom: 32,
                            border: '2px solid #bfdbfe',
                        }}
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                    </div>

                    <h1
                        style={{
                            fontSize: 72,
                            fontWeight: 800,
                            color: '#0f172a',
                            marginBottom: 20,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.1,
                        }}
                    >
                        Explore <span style={{ color: '#2563eb' }}>Opportunities</span>
                    </h1>

                    <p
                        style={{
                            fontSize: 30,
                            color: '#64748b',
                            maxWidth: 800,
                            lineHeight: 1.5,
                            marginBottom: 48,
                        }}
                    >
                        Browse hundreds of open positions across various industries and find your perfect fit.
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            backgroundColor: '#1e293b',
                            color: 'white',
                            padding: '16px 32px',
                            borderRadius: '100px',
                            fontSize: 24,
                            fontWeight: 600,
                        }}
                    >
                        Apply Today
                    </div>
                </div>

                {/* Footer brand */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#94a3b8',
                        fontSize: 20,
                        fontWeight: 500,
                    }}
                >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2563eb' }} />
                    Careers Platform
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}

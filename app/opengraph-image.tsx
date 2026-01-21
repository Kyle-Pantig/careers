import { ImageResponse } from 'next/og';

export const alt = 'Careers Platform';
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
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #eff6ff 0%, #ffffff 100%)',
                    padding: '40px 80px',
                }}
            >
                {/* Decorative Background Elements */}
                <div
                    style={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        backgroundColor: '#dbeafe',
                        opacity: 0.5,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -150,
                        left: -150,
                        width: 500,
                        height: 500,
                        borderRadius: '50%',
                        backgroundColor: '#dbeafe',
                        opacity: 0.5,
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
                    {/* Logo Placeholder */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 80,
                            height: 80,
                            backgroundColor: '#2563eb',
                            borderRadius: 20,
                            marginBottom: 32,
                            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
                        }}
                    >
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                    </div>

                    <h1
                        style={{
                            fontSize: 72,
                            fontWeight: 800,
                            color: '#0f172a',
                            marginBottom: 16,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Careers <span style={{ color: '#2563eb' }}>Platform</span>
                    </h1>

                    <p
                        style={{
                            fontSize: 32,
                            color: '#64748b',
                            maxWidth: 800,
                            lineHeight: 1.4,
                        }}
                    >
                        Find your next opportunity and join our world-class team.
                    </p>

                    <div
                        style={{
                            marginTop: 48,
                            display: 'flex',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            padding: '16px 32px',
                            borderRadius: 50,
                            fontSize: 24,
                            fontWeight: 600,
                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                        }}
                    >
                        View Open Positions
                    </div>
                </div>

                {/* Footer info */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        display: 'flex',
                        alignItems: 'center',
                        color: '#94a3b8',
                        fontSize: 20,
                    }}
                >
                    https://yourcareers.vercel.app
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}

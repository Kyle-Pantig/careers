import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return handleProxy(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return handleProxy(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return handleProxy(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return handleProxy(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return handleProxy(request, path);
}

async function handleProxy(request: NextRequest, path: string[]) {
    // If path is somehow undefined or null, default to empty string
    const targetPath = (path || []).join('/');
    const url = new URL(`${API_URL.replace(/\/$/, '')}/${targetPath}`);

    // Copy search params from request to target URL
    const searchParams = typeof request.nextUrl.searchParams === 'object'
        ? request.nextUrl.searchParams
        : new URL(request.url).searchParams;

    searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
    });

    const headers = new Headers(request.headers);
    headers.delete('host');

    try {
        const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.blob();

        const response = await fetch(url.toString(), {
            method: request.method,
            headers,
            body,
            credentials: 'include',
            cache: 'no-store'
        });

        // Some responses might not be JSON, but for this app most auth/api are
        const data = await response.json().catch(() => null);

        const newResponse = NextResponse.json(data, {
            status: response.status,
        });

        // Properly forward multiple set-cookie headers (required for multi-cookie auth)
        // Headers.get() only returns the first one concatenated. 
        // We use getSetCookie() if available (Next.js/Modern browsers) or iterate.
        if (response.headers.getSetCookie) {
            const cookies = response.headers.getSetCookie();
            cookies.forEach(cookie => {
                newResponse.headers.append('set-cookie', cookie);
            });
        } else {
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                newResponse.headers.set('set-cookie', setCookie);
            }
        }

        return newResponse;
    } catch (error) {
        console.error('Proxy error targeting:', url.toString(), error);
        return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 });
    }
}

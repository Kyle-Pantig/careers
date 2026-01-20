const PROXY_URL = '/api/proxy';

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  // Use proxy for backend calls to avoid cross-domain cookie issues
  const res = await fetch(`${PROXY_URL}${endpoint}`, {
    ...options,
    credentials: options?.credentials || 'include',
  });
  return res.json();
}
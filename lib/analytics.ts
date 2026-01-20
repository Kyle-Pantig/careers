const API_URL = '/api/proxy';

export type PageType = 'HOME' | 'JOBS';

export interface DailyPageView {
  date: string;
  home: number;
  jobs: number;
}

export interface PageViewStats {
  dailyPageViews: DailyPageView[];
  totals: {
    home_total: number;
    jobs_total: number;
  };
}

export async function trackPageView(page: PageType): Promise<void> {
  try {
    await fetch(`${API_URL}/analytics/page-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ page }),
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience for analytics
    console.error('Failed to track page view:', error);
  }
}

export async function getPageViewStats(): Promise<PageViewStats> {
  const res = await fetch(`${API_URL}/analytics/page-views`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok || result.error) {
    throw new Error(result.error || 'Failed to fetch page view stats');
  }

  return result;
}

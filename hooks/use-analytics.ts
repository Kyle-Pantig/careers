'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { trackPageView, getPageViewStats, PageType } from '@/lib/analytics';

// Hook to track page views - fires once per page mount
export function useTrackPageView(page: PageType) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per component mount
    if (!tracked.current) {
      tracked.current = true;
      trackPageView(page);
    }
  }, [page]);
}

// Hook to get page view statistics (admin only)
export function usePageViewStats() {
  return useQuery({
    queryKey: ['page-view-stats'],
    queryFn: getPageViewStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

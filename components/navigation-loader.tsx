'use client';

import { useEffect, useState } from 'react';

export function NavigationLoader() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Watch for nprogress element to appear/disappear
    const observer = new MutationObserver(() => {
      const nprogress = document.getElementById('nprogress');
      setIsLoading(!!nprogress);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 bg-white/50 backdrop-blur-[1px] z-[1030] transition-opacity duration-200"
      style={{ pointerEvents: 'auto' }}
    />
  );
}

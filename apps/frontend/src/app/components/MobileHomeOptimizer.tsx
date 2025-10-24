'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';

export function MobileHomeOptimizer() {
  const pathname = usePathname();

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    // Add mobile-specific meta tags
    const metaTags = [
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-touch-fullscreen', content: 'yes' },
      { name: 'format-detection', content: 'telephone=no' }
    ];

    metaTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });
  }, [isMobile]);

  const optimizeForMobile = useCallback(() => {
    if (!isMobile) return;

    // Disable hover effects on mobile
    document.body.classList.add('mobile-optimized');

    // Optimize touch targets
    const style = document.createElement('style');
    style.textContent = `
      .mobile-optimized button,
      .mobile-optimized a {
        min-height: 44px;
        min-width: 44px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [isMobile]);

  useEffect(() => {
    const cleanup = optimizeForMobile();
    return cleanup;
  }, [optimizeForMobile]);

  return null;
}
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Disable smooth scroll on dashboard adjacent routes where layout handles scrolling
  const isAppRoute = pathname?.startsWith('/dashboard') || 
                     pathname?.startsWith('/products') || 
                     pathname?.startsWith('/warranties') ||
                     pathname?.startsWith('/settings');

  useEffect(() => {
    // Determine if we should initialize smooth scroll
    if (isAppRoute) {
      // Ensure any lingering styles or classes from previous routes are cleaned up
      document.documentElement.classList.remove('has-scroll-smooth');
      document.body.classList.remove('has-scroll-smooth');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
      return;
    }

    let scroll: any;

    const initScroll = async () => {
      try {
        const LocomotiveScroll = (await import('locomotive-scroll')).default;
        scroll = new LocomotiveScroll({
          lenisOptions: {
            wrapper: window,
            content: document.documentElement,
            lerp: 0.1,
            duration: 1.2,
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            normalizeWheel: true,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
          }
        });
      } catch (error) {
        console.error("Locomotive Scroll init failed", error);
      }
    };

    initScroll();

    return () => {
      if (scroll) scroll.destroy();
      // Force cleanup of classes and styles on unmount
      document.documentElement.classList.remove('has-scroll-smooth');
      document.body.classList.remove('has-scroll-smooth');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
    };
  }, [isAppRoute]);

  return <>{children}</>;
}

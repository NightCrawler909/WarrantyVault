'use client';

import { useEffect } from 'react';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let scroll: any;

    const initScroll = async () => {
      const LocomotiveScroll = (await import('locomotive-scroll')).default;
      scroll = new LocomotiveScroll();
    };

    initScroll();

    return () => {
      if (scroll) scroll.destroy();
    };
  }, []);

  return <>{children}</>;
}

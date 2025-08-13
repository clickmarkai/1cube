"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function PerformanceMonitor() {
  const pathname = usePathname();
  const navigationStartRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Track navigation start
    navigationStartRef.current = performance.now();
    console.log('🔄 Navigation started to:', pathname, 'at', navigationStartRef.current);

    // Track when DOM is ready
    const domReady = () => {
      const domReadyTime = performance.now();
      const navigationTime = domReadyTime - (navigationStartRef.current || 0);
      console.log(`🏁 DOM ready for ${pathname} in ${navigationTime.toFixed(2)}ms`);
    };

    // Track when component is fully loaded
    const componentReady = () => {
      const componentReadyTime = performance.now();
      const totalTime = componentReadyTime - (navigationStartRef.current || 0);
      console.log(`✅ Component fully loaded for ${pathname} in ${totalTime.toFixed(2)}ms`);
      
      // Log performance entries
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming;
        console.log('📊 Performance metrics:', {
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          ttfb: navEntry.responseStart - navEntry.requestStart,
        });
      }
    };

    // Use both immediate execution and RAF for different timing measurements
    domReady();
    requestAnimationFrame(componentReady);

  }, [pathname]);

  return null; // This component doesn't render anything
}
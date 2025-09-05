"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { navLogger } from '@/lib/logger';

export function NavigationDebugger() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | undefined>(undefined);
  const routeChangeStartRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const currentTime = performance.now();
    
    if (previousPathnameRef.current && previousPathnameRef.current !== pathname) {
      // Route change detected
      const routeChangeTime = currentTime - (routeChangeStartRef.current || currentTime);
      navLogger.debug(`🔄 Route changed from ${previousPathnameRef.current} to ${pathname} in ${routeChangeTime.toFixed(2)}ms`);
    } else {
      navLogger.debug(`📍 Initial route load: ${pathname}`);
    }
    
    // Set up for next route change
    previousPathnameRef.current = pathname;
    routeChangeStartRef.current = currentTime;
    
    // Log when this component is fully rendered
    requestAnimationFrame(() => {
      const renderTime = performance.now() - currentTime;
      navLogger.debug(`🎨 NavigationDebugger rendered for ${pathname} in ${renderTime.toFixed(2)}ms`);
    });

  }, [pathname]);

  return null;
}
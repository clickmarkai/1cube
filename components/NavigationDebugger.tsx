"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function NavigationDebugger() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string>();
  const routeChangeStartRef = useRef<number>();

  useEffect(() => {
    const currentTime = performance.now();
    
    if (previousPathnameRef.current && previousPathnameRef.current !== pathname) {
      // Route change detected
      const routeChangeTime = currentTime - (routeChangeStartRef.current || currentTime);
      console.log(`🔄 Route changed from ${previousPathnameRef.current} to ${pathname} in ${routeChangeTime.toFixed(2)}ms`);
    } else {
      console.log(`📍 Initial route load: ${pathname}`);
    }
    
    // Set up for next route change
    previousPathnameRef.current = pathname;
    routeChangeStartRef.current = currentTime;
    
    // Log when this component is fully rendered
    requestAnimationFrame(() => {
      const renderTime = performance.now() - currentTime;
      console.log(`🎨 NavigationDebugger rendered for ${pathname} in ${renderTime.toFixed(2)}ms`);
    });

  }, [pathname]);

  return null;
}
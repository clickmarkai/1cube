"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { routerLogger } from '@/lib/logger';

export function RouterDebugger() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    routerLogger.debug('🔧 Router debugging initialized for:', pathname);
    
    // Test router performance
    const testRouterMethods = () => {
      routerLogger.debug('🧪 Testing router methods...');
      
      // Test prefetch performance
      const prefetchStart = performance.now();
      try {
        router.prefetch('/app/campaigns');
        const prefetchEnd = performance.now();
        routerLogger.debug(`⚡ router.prefetch() took ${prefetchEnd - prefetchStart}ms`);
      } catch (error) {
        routerLogger.error('❌ router.prefetch() error:', error);
      }
      
      // Test if router.push is blocking
      routerLogger.debug('🔗 Router push test (will not actually navigate)');
      const pushStart = performance.now();
      // We won't actually call push here, just log that we're ready to
      const pushEnd = performance.now();
      routerLogger.debug(`⚡ Router push preparation took ${pushEnd - pushStart}ms`);
    };

    // Run tests after a short delay
    setTimeout(testRouterMethods, 500);
  }, [router, pathname]);

  return null;
}
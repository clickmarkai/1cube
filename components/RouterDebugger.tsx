"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function RouterDebugger() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('🔧 Router debugging initialized for:', pathname);
    
    // Test router performance
    const testRouterMethods = () => {
      console.log('🧪 Testing router methods...');
      
      // Test prefetch performance
      const prefetchStart = performance.now();
      try {
        router.prefetch('/app/campaigns');
        const prefetchEnd = performance.now();
        console.log(`⚡ router.prefetch() took ${prefetchEnd - prefetchStart}ms`);
      } catch (error) {
        console.error('❌ router.prefetch() error:', error);
      }
      
      // Test if router.push is blocking
      console.log('🔗 Router push test (will not actually navigate)');
      const pushStart = performance.now();
      // We won't actually call push here, just log that we're ready to
      const pushEnd = performance.now();
      console.log(`⚡ Router push preparation took ${pushEnd - pushStart}ms`);
    };

    // Run tests after a short delay
    setTimeout(testRouterMethods, 500);
  }, [router, pathname]);

  return null;
}
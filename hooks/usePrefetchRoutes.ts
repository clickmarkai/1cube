"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const MAIN_ROUTES = [
  '/app',
  '/app/campaigns',
  '/app/content',
  '/app/intelligence',
  '/app/bundles',
  '/app/email',
  '/app/chatbot',
  '/app/inventory',
  '/app/listings',
  '/app/orders',
  '/app/analytics',
  '/app/creatives-lab',
  '/app/settings',
];

export function usePrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch all main routes on app load
    const prefetchRoutes = () => {
      console.log('🚀 Starting bulk prefetch of all routes...');
      const startTime = performance.now();
      
      for (const route of MAIN_ROUTES) {
        try {
          console.log(`🔄 Bulk prefetching: ${route}`);
          const routeStart = performance.now();
          router.prefetch(route);
          const routeEnd = performance.now();
          console.log(`✅ Bulk prefetch completed: ${route} in ${routeEnd - routeStart}ms`);
        } catch (error) {
          console.error(`❌ Failed to prefetch route: ${route}`, error);
        }
      }
      
      const endTime = performance.now();
      console.log(`🎯 All routes prefetched in ${endTime - startTime}ms`);
    };

    // Delay prefetching to not block initial render
    console.log('⏰ Setting up prefetch timer...');
    const timer = setTimeout(prefetchRoutes, 100);
    return () => clearTimeout(timer);
  }, [router]);
}
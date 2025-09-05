"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { navLogger } from '@/lib/logger';

interface InstantNavProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function InstantNav({ href, children, className, onClick }: InstantNavProps) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Prefetch on mount and hover
  useEffect(() => {
    navLogger.debug('🔄 Prefetching route on mount:', href);
    const start = performance.now();
    try {
      router.prefetch(href);
      const end = performance.now();
      navLogger.debug(`✅ Prefetch completed for ${href} in ${end - start}ms`);
    } catch (err) {
      navLogger.error(`❌ Prefetch failed for ${href}:`, err);
    }
  }, [href, router]);

  const handleMouseEnter = () => {
    navLogger.debug('🖱️ Mouse enter, prefetching:', href);
    // Aggressive prefetching
    clearTimeout(timeoutRef.current);
    const start = performance.now();
    try {
      router.prefetch(href);
      const end = performance.now();
      navLogger.debug(`✅ Hover prefetch completed for ${href} in ${end - start}ms`);
    } catch (err) {
      navLogger.error(`❌ Hover prefetch failed for ${href}:`, err);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    navLogger.debug('🔗 Navigation clicked:', href);
    const navigationStart = performance.now();
    
    // Immediate visual feedback
    if (onClick) onClick();
    
    navLogger.debug('🚀 Starting router.push for:', href);
    
    // Instant navigation without transition delay
    router.push(href);
    
    // Log the time it takes
    requestAnimationFrame(() => {
      const navigationEnd = performance.now();
      navLogger.debug(`📊 Navigation to ${href} initiated in ${navigationEnd - navigationStart}ms`);
    });
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={className}
    >
      {children}
    </a>
  );
}
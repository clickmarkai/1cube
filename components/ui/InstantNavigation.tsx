"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface InstantNavProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function InstantNav({ href, children, className, onClick }: InstantNavProps) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Prefetch on mount and hover
  useEffect(() => {
    console.log('🔄 Prefetching route on mount:', href);
    const start = performance.now();
    try {
      router.prefetch(href);
      const end = performance.now();
      console.log(`✅ Prefetch completed for ${href} in ${end - start}ms`);
    } catch (err) {
      console.error(`❌ Prefetch failed for ${href}:`, err);
    }
  }, [href, router]);

  const handleMouseEnter = () => {
    console.log('🖱️ Mouse enter, prefetching:', href);
    // Aggressive prefetching
    clearTimeout(timeoutRef.current);
    const start = performance.now();
    try {
      router.prefetch(href);
      const end = performance.now();
      console.log(`✅ Hover prefetch completed for ${href} in ${end - start}ms`);
    } catch (err) {
      console.error(`❌ Hover prefetch failed for ${href}:`, err);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔗 Navigation clicked:', href);
    const navigationStart = performance.now();
    
    // Immediate visual feedback
    if (onClick) onClick();
    
    console.log('🚀 Starting router.push for:', href);
    
    // Instant navigation without transition delay
    router.push(href);
    
    // Log the time it takes
    requestAnimationFrame(() => {
      const navigationEnd = performance.now();
      console.log(`📊 Navigation to ${href} initiated in ${navigationEnd - navigationStart}ms`);
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
'use client';

/**
 * BrandMark — SVG healthcare logo + wordmark.
 * Teal cross + "PDC" brand.
 */

import Link from 'next/link';
import { cn } from '@/utils/cn';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
}

const SIZE = { sm: 28, md: 36, lg: 44 };

export function BrandMark({ size = 'md', href = '/', className }: BrandMarkProps) {
  const s = SIZE[size];

  const mark = (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Teal cross icon */}
      <div
        className="relative flex-shrink-0 rounded-xl bg-primary"
        style={{ width: s, height: s }}
      >
        {/* Vertical bar */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{ width: s * 0.22, height: s * 0.58 }}
        />
        {/* Horizontal bar */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{ width: s * 0.58, height: s * 0.22 }}
        />
      </div>

      {/* Wordmark */}
      <div>
        <div
          className="font-bold leading-none tracking-tight text-foreground"
          style={{ fontSize: s * 0.5 }}
        >
          HealthConsult
        </div>
        <div
          className="leading-none text-muted-foreground"
          style={{ fontSize: s * 0.3 }}
        >
          Your trusted care partner
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{mark}</Link>;
  }
  return mark;
}

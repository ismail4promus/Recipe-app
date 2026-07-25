import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

/* A toolbar that freezes flush under the app header while scrolling.
   Detects the "stuck" state (classic sticky-sentinel trick: observe the
   sticky element with a negative top rootMargin equal to the header height)
   and lifts a subtle shadow only when pinned. Solid surface — no bleed. */
const HEADER_OFFSET = 56; // h-14 header

export const StickyToolbar: React.FC<{ className?: string; innerClassName?: string; children: React.ReactNode }> = ({ className, innerClassName, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(entry.intersectionRatio < 1),
      { threshold: [1], rootMargin: `-${HEADER_OFFSET + 1}px 0px 0px 0px` }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn('sticky top-0 z-30 py-1.5', className)}>
      <div
        className={cn(
          'border border-app-border bg-app-card p-1.5 transition-shadow duration-150',
          stuck ? 'shadow-card' : 'shadow-soft',
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default StickyToolbar;

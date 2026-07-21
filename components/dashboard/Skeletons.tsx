import React from 'react';
import { cn } from '../../lib/utils';

const Block: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-white/[0.06]', className)} />
);

// Loading skeleton mirroring the dashboard layout so nothing flashes empty.
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Block className="h-7 w-56" />
      <Block className="h-4 w-72" />
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Block key={i} className="h-20" />
      ))}
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Block key={i} className="h-32" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Block className="h-64 lg:col-span-2" />
      <Block className="h-64" />
    </div>
  </div>
);

export { Block };
export default DashboardSkeleton;

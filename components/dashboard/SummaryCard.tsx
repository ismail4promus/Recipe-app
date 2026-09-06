import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';

type Accent = 'primary' | 'info' | 'success' | 'warning' | 'danger';

const ACCENT: Record<Accent, { icon: string; ring: string; fill: string }> = {
  primary: { icon: 'text-app-primary bg-app-primary/10', ring: 'hover:border-app-primary/40', fill: 'bg-app-primary' },
  info: { icon: 'text-app-info bg-app-info/10', ring: 'hover:border-app-info/40', fill: 'bg-app-info' },
  success: { icon: 'text-app-success bg-app-success/10', ring: 'hover:border-app-success/40', fill: 'bg-app-success' },
  warning: { icon: 'text-app-warning bg-app-warning/10', ring: 'hover:border-app-warning/40', fill: 'bg-app-warning' },
  danger: { icon: 'text-app-danger bg-app-danger/10', ring: 'hover:border-app-danger/40', fill: 'bg-app-danger' },
};

interface SummaryCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  hint?: string;
  accent?: Accent;
  to?: string;
  trend?: { value: string; direction: 'up' | 'down'; good?: boolean };
  bar?: number; // 0..1 — thin status bar at the bottom
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon: Icon, title, value, hint, accent = 'primary', to, trend, bar }) => {
  const a = ACCENT[accent];
  const pct = bar === undefined ? 0 : Math.round(Math.min(1, Math.max(0, bar)) * 100);
  // Icon and figures share one row; the status bar is a hairline on the bottom
  // edge rather than its own stacked block.
  const body = (
    <div
      className={cn(
        'group relative flex h-full items-center gap-2.5 overflow-hidden rounded-2xl border border-app-border bg-app-card px-3 py-2.5 shadow-soft transition-colors duration-200',
        to && cn('cursor-pointer', a.ring)
      )}
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', a.icon)}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-xs font-medium text-app-muted">{title}</p>
          {trend && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold',
                (trend.good ?? trend.direction === 'up') ? 'text-app-success' : 'text-app-danger'
              )}
            >
              {trend.direction === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
        </div>
        <p className="text-lg font-bold leading-tight tracking-tight text-app-text tabular-nums">{value}</p>
        {hint && <p className="truncate text-[11px] leading-tight text-app-muted">{hint}</p>}
      </div>

      {bar !== undefined && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-app-muted/15">
          <div className={cn('h-full transition-all', a.fill)} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
        {body}
      </Link>
    );
  }
  return body;
};

export default SummaryCard;

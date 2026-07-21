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
  const body = (
    <div
      className={cn(
        'group flex h-full flex-col rounded-lg border border-app-border bg-app-card p-3 transition-all duration-200',
        to && cn('cursor-pointer hover:-translate-y-0.5 hover:shadow-card', a.ring)
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-md', a.icon)}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold',
              (trend.good ?? trend.direction === 'up') ? 'text-app-success' : 'text-app-danger'
            )}
          >
            {trend.direction === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-2 text-[13px] font-medium text-app-muted leading-tight md:text-sm">{title}</p>
      <p className="mt-0.5 text-xl font-bold tracking-tight text-app-text tabular-nums md:text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-app-muted">{hint}</p>}
      {bar !== undefined && (
        <div className="mt-auto pt-2">
          <div className="h-1 overflow-hidden rounded-sm bg-app-muted/15">
            <div className={cn('h-full transition-all', a.fill)} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
        {body}
      </Link>
    );
  }
  return body;
};

export default SummaryCard;

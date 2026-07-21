import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';

type Accent = 'primary' | 'info' | 'success' | 'warning' | 'danger';

const ACCENT: Record<Accent, { icon: string; ring: string }> = {
  primary: { icon: 'text-app-primary bg-app-primary/10', ring: 'hover:border-app-primary/40' },
  info: { icon: 'text-app-info bg-app-info/10', ring: 'hover:border-app-info/40' },
  success: { icon: 'text-app-success bg-app-success/10', ring: 'hover:border-app-success/40' },
  warning: { icon: 'text-app-warning bg-app-warning/10', ring: 'hover:border-app-warning/40' },
  danger: { icon: 'text-app-danger bg-app-danger/10', ring: 'hover:border-app-danger/40' },
};

interface SummaryCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  hint?: string;
  accent?: Accent;
  to?: string;
  trend?: { value: string; direction: 'up' | 'down'; good?: boolean };
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon: Icon, title, value, hint, accent = 'primary', to, trend }) => {
  const a = ACCENT[accent];
  const body = (
    <div
      className={cn(
        'group h-full rounded-xl border border-app-border bg-app-card p-5 transition-all duration-200',
        to && cn('cursor-pointer hover:-translate-y-0.5 hover:shadow-lg', a.ring)
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', a.icon)}>
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
      <p className="mt-4 text-sm font-medium text-app-muted">{title}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-app-text tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-app-muted">{hint}</p>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
        {body}
      </Link>
    );
  }
  return body;
};

export default SummaryCard;

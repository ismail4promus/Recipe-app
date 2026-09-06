import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AlertSeverity = 'urgent' | 'warning' | 'info';

const SEVERITY: Record<AlertSeverity, { border: string; icon: string }> = {
  urgent: { border: 'border-l-app-danger', icon: 'text-app-danger bg-app-danger/10' },
  warning: { border: 'border-l-app-warning', icon: 'text-app-warning bg-app-warning/10' },
  info: { border: 'border-l-app-info', icon: 'text-app-info bg-app-info/10' },
};

interface AlertItemProps {
  icon: LucideIcon;
  title: string;
  message: string;
  severity?: AlertSeverity;
  actionLabel: string;
  to: string;
}

const AlertItem: React.FC<AlertItemProps> = ({ icon: Icon, title, message, severity = 'warning', actionLabel, to }) => {
  const s = SEVERITY[severity];
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-2xl border border-app-border border-l-[3px] bg-app-card px-2.5 py-2',
        s.border
      )}
    >
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', s.icon)}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight text-app-text">{title}</p>
        <p className="truncate text-[11px] leading-tight text-app-muted">{message}</p>
      </div>
      <Link
        to={to}
        className="shrink-0 rounded-full border border-app-border bg-app-card px-3 py-1 text-[11px] font-semibold text-app-text transition-colors hover:border-app-primary/50 hover:text-app-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
      >
        {actionLabel}
      </Link>
    </div>
  );
};

export default AlertItem;

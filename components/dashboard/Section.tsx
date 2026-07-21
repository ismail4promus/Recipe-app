import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SectionProps {
  title: string;
  icon?: LucideIcon;
  action?: { label: string; to: string };
  className?: string;
  count?: number;
  countTone?: 'danger' | 'warning' | 'muted';
  children: React.ReactNode;
}

// Card wrapper with a clear title + optional "view all" link. Used for every dashboard block.
const Section: React.FC<SectionProps> = ({ title, icon: Icon, action, className, count, countTone = 'muted', children }) => (
  <section className={cn('rounded-xl border border-app-border bg-app-card', className)}>
    <header className="flex items-center justify-between gap-3 border-b border-app-border px-4 py-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-app-muted" />}
        <h2 className="text-sm font-bold text-app-text">{title}</h2>
        {count !== undefined && count > 0 && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
              countTone === 'danger' && 'bg-app-danger/15 text-app-danger',
              countTone === 'warning' && 'bg-app-warning/15 text-app-warning',
              countTone === 'muted' && 'bg-white/5 text-app-muted'
            )}
          >
            {count}
          </span>
        )}
      </div>
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-app-primary transition-colors hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 rounded"
        >
          {action.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </header>
    <div className="p-4">{children}</div>
  </section>
);

export default Section;

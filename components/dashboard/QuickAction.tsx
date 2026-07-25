import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  to: string;
  primary?: boolean;
}

// Large, touch-friendly (>=44px) quick action button.
const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, to, primary }) => (
  <Link
    to={to}
    className={cn(
      'flex min-h-[44px] items-center justify-center gap-2 border px-2 py-2 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 active:scale-[0.97]',
      primary
        ? 'border-app-primary bg-app-primary text-primary-foreground hover:brightness-105'
        : 'border-app-border bg-app-card text-app-text hover:border-app-primary/40 hover:bg-app-muted/[0.06]'
    )}
  >
    <Icon className={cn('h-4 w-4 shrink-0', primary ? '' : 'text-app-primary')} strokeWidth={2} />
    <span className="truncate text-xs font-semibold leading-tight">{label}</span>
  </Link>
);

export default QuickAction;

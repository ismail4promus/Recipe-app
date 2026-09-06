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
      'flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border px-2 py-2 text-center shadow-soft transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/50 active:scale-[0.97]',
      primary
        ? 'border-app-primary bg-app-primary text-primary-foreground hover:brightness-110'
        : 'border-app-border bg-app-card text-app-text hover:border-app-primary/35 hover:bg-app-elevated'
    )}
  >
    <Icon className={cn('h-4 w-4 shrink-0', primary ? '' : 'text-app-primary')} strokeWidth={2} />
    <span className="truncate text-xs font-semibold leading-tight">{label}</span>
  </Link>
);

export default QuickAction;

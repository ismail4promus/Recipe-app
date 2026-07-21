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
      'flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 active:scale-[0.97]',
      primary
        ? 'border-transparent bg-app-primary text-primary-foreground shadow-md shadow-app-primary/20 hover:brightness-105'
        : 'border-app-border bg-app-card text-app-text hover:border-app-primary/40 hover:bg-white/[0.03]'
    )}
  >
    <Icon className={cn('h-5 w-5', primary ? '' : 'text-app-primary')} strokeWidth={2} />
    <span className="text-xs font-semibold leading-tight">{label}</span>
  </Link>
);

export default QuickAction;

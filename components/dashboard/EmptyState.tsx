import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  to?: string;
  compact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message, actionLabel, to, compact }) => (
  <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-12'}`}>
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-app-success/10 text-app-success">
      <Icon className="h-6 w-6" />
    </span>
    <p className="mt-3 text-sm font-semibold text-app-text">{title}</p>
    {message && <p className="mt-1 max-w-xs text-xs text-app-muted">{message}</p>}
    {actionLabel && to && (
      <Link
        to={to}
        className="mt-4 rounded-lg border border-app-border px-4 py-2 text-xs font-semibold text-app-text transition-colors hover:border-app-primary/50 hover:text-app-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
      >
        {actionLabel}
      </Link>
    )}
  </div>
);

export default EmptyState;

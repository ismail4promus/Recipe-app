import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

/* Shared UI kit: compact, subtly-rounded controls. Dark-first, orange primary,
   fully theme-token driven (works in light + dark). */

// ---- Button ----
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-app-primary text-primary-foreground hover:brightness-105 shadow-soft',
  secondary: 'bg-app-elevated text-app-text hover:bg-app-elevated/70 border border-app-border',
  ghost: 'text-app-text hover:bg-app-muted/10',
  danger: 'bg-app-danger text-white hover:brightness-105',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  icon?: LucideIcon;
  full?: boolean;
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', icon: Icon, full, className, children, ...props }) => (
  <button
    className={cn(
      'inline-flex h-9 items-center justify-center gap-1.5 px-3.5 text-sm font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 disabled:opacity-50',
      BTN[variant], full && 'w-full', className
    )}
    {...props}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {children}
  </button>
);

// ---- Segmented toggle ----
interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}
export function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div className={cn('inline-flex border border-app-border bg-app-elevated', className)} role="tablist">
      {options.map(o => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-8 px-3.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60',
            value === o.value ? 'bg-app-primary text-primary-foreground' : 'text-app-muted hover:text-app-text'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---- Chip (filter) ----
export const Chip: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string }> = ({ active, onClick, children, className }) => (
  <button
    onClick={onClick}
    className={cn(
      'whitespace-nowrap border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60',
      active
        ? 'border-app-primary bg-app-primary text-primary-foreground'
        : 'border-app-border bg-app-elevated text-app-muted hover:border-app-primary/40 hover:text-app-text',
      className
    )}
  >
    {children}
  </button>
);

// ---- Compact icon button (square, subtly rounded) ----
export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }
> = ({ icon: Icon, label, className, ...props }) => (
  <button
    aria-label={label}
    title={label}
    className={cn(
      'flex h-8 w-8 items-center justify-center border border-app-border bg-app-elevated text-app-text transition-colors hover:border-app-primary/40 hover:bg-app-muted/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60',
      className
    )}
    {...props}
  >
    <Icon className="h-4 w-4" />
  </button>
);

// ---- Page header (optional back + action) ----
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  backTo?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, backTo, onBack, action, className }) => (
  <div className={cn('mb-2 flex items-center gap-2 border-b border-app-border pb-2', className)}>
    {(backTo || onBack) &&
      (backTo ? (
        <Link to={backTo} aria-label="Back" className="flex h-8 w-8 shrink-0 items-center justify-center border border-app-border bg-app-elevated text-app-text hover:border-app-primary/40 hover:bg-app-muted/15">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <button onClick={onBack} aria-label="Back" className="flex h-8 w-8 shrink-0 items-center justify-center border border-app-border bg-app-elevated text-app-text hover:border-app-primary/40 hover:bg-app-muted/15">
          <ChevronLeft className="h-4 w-4" />
        </button>
      ))}
    <div className="min-w-0 flex-1">
      <h1 className="truncate text-lg font-bold tracking-tight text-app-text md:text-xl">{title}</h1>
      {subtitle && <p className="truncate text-xs text-app-muted">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

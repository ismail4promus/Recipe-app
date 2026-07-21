import React from 'react';
import { cn } from '../../lib/utils';
import { OrderStatus } from '../../types';

// Friendly, food-oriented status vocabulary shared across the dashboard.
export type CookingStatus = 'Not Started' | 'Preparing' | 'Cooking' | 'Ready' | 'Completed';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE_STYLES: Record<Tone, string> = {
  neutral: 'bg-white/5 text-app-muted border-white/10',
  info: 'bg-app-info/10 text-app-info border-app-info/25',
  success: 'bg-app-success/10 text-app-success border-app-success/25',
  warning: 'bg-app-warning/10 text-app-warning border-app-warning/25',
  danger: 'bg-app-danger/10 text-app-danger border-app-danger/25',
};

// Map raw order status -> friendly label + tone.
const ORDER_MAP: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending_approval: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'info' },
  processing: { label: 'In Progress', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

const COOKING_MAP: Record<CookingStatus, Tone> = {
  'Not Started': 'neutral',
  Preparing: 'warning',
  Cooking: 'info',
  Ready: 'success',
  Completed: 'success',
};

export const orderStatusLabel = (status: OrderStatus) => ORDER_MAP[status]?.label ?? status;

const Badge: React.FC<{ label: string; tone: Tone; className?: string; dot?: boolean }> = ({ label, tone, className, dot }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
      TONE_STYLES[tone],
      className
    )}
  >
    {dot && <span className={cn('h-1.5 w-1.5 rounded-full', {
      neutral: 'bg-app-muted', info: 'bg-app-info', success: 'bg-app-success', warning: 'bg-app-warning', danger: 'bg-app-danger',
    }[tone])} />}
    {label}
  </span>
);

export const OrderStatusBadge: React.FC<{ status: OrderStatus; className?: string }> = ({ status, className }) => {
  const cfg = ORDER_MAP[status] ?? { label: status, tone: 'neutral' as Tone };
  return <Badge label={cfg.label} tone={cfg.tone} className={className} dot />;
};

export const CookingStatusBadge: React.FC<{ status: CookingStatus; className?: string }> = ({ status, className }) => (
  <Badge label={status} tone={COOKING_MAP[status]} className={className} dot />
);

export default Badge;

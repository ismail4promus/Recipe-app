import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { OrderStatusBadge } from './StatusBadge';

const formatShortDate = (d?: Date) => {
  if (!d) return 'No date';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d));
  } catch {
    return 'No date';
  }
};

const OrderRow: React.FC<{ order: Order; to: string }> = ({ order, to }) => {
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-app-muted/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-app-text">{order.customerName}</p>
          <span className="shrink-0 text-xs text-app-muted">#{order.orderNumber.slice(-5)}</span>
        </div>
        <p className="mt-0.5 text-xs text-app-muted">
          {formatShortDate(order.dueDate)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-semibold text-app-text tabular-nums">{formatCurrency(order.totalAmount)}</span>
        <OrderStatusBadge status={order.status} />
      </div>
    </Link>
  );
};

export default OrderRow;

import { Ingredient, Order } from '../types';
import { LOW_STOCK_PACKAGES } from './shoppingList';

/**
 * What the kitchen needs to know about right now.
 *
 * Derived in one place so the dashboard panel and the header bell can never
 * disagree about how many things are wrong — a bell showing "3" over a panel
 * listing five items is worse than no bell at all.
 */

export type AlertSeverity = 'urgent' | 'warning' | 'info';
export type AlertKind = 'out-of-stock' | 'low-stock' | 'expiring' | 'expired' | 'order-overdue' | 'order-urgent';

export interface KitchenAlert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionLabel: string;
  to: string;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { urgent: 0, warning: 1, info: 2 };

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

const daysBetween = (from: Date, to: Date) =>
  Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);

/** When an item goes off, counted from the last time someone verified it. */
export const expiryDate = (i: Ingredient): Date => {
  const e = new Date(i.last_verified || new Date());
  e.setDate(e.getDate() + (i.shelf_life_days || 365));
  return e;
};

/** Orders that still have work outstanding. */
const OPEN_STATUSES = ['pending_approval', 'approved', 'processing'];

export const buildAlerts = (ingredients: Ingredient[], orders: Order[], now: Date = new Date()): KitchenAlert[] => {
  const alerts: KitchenAlert[] = [];

  ingredients.forEach(i => {
    if ((i.packagesInStock || 0) <= 0) {
      alerts.push({
        id: `stock-out-${i.id}`, kind: 'out-of-stock', severity: 'urgent',
        title: i.name, message: 'Out of stock — restock to keep cooking.',
        actionLabel: 'Update Stock', to: '/pantry?filter=low',
      });
    } else if (i.packagesInStock <= LOW_STOCK_PACKAGES) {
      alerts.push({
        id: `stock-low-${i.id}`, kind: 'low-stock', severity: 'warning',
        title: i.name, message: `Running low — ${i.packagesInStock} ${i.packageUnit} left.`,
        actionLabel: 'Update Stock', to: '/pantry?filter=low',
      });
    }

    const days = daysBetween(now, expiryDate(i));
    if (days <= 7) {
      alerts.push({
        id: `expiry-${i.id}`,
        kind: days < 0 ? 'expired' : 'expiring',
        severity: days < 0 ? 'urgent' : 'warning',
        title: i.name,
        message: days < 0
          ? 'Expired — check before use.'
          : days === 0 ? 'Expires today.' : `Expires in ${days} day${days === 1 ? '' : 's'}.`,
        actionLabel: 'View Ingredient', to: '/pantry?filter=expiring',
      });
    }
  });

  orders.forEach(o => {
    if (!OPEN_STATUSES.includes(o.status)) return;
    const overdue = !!o.dueDate && daysBetween(now, new Date(o.dueDate)) < 0;
    const urgent = o.priority === 'high';
    if (!overdue && !urgent) return;

    alerts.push({
      id: `order-${o.id}`,
      kind: overdue ? 'order-overdue' : 'order-urgent',
      severity: 'urgent',
      title: `Order #${o.orderNumber.slice(-5)} — ${o.customerName}`,
      message: overdue ? 'Past its due date and not completed yet.' : 'Marked high priority — needs attention.',
      actionLabel: 'View Order', to: `/orders?q=${encodeURIComponent(o.orderNumber)}`,
    });
  });

  return alerts.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
};

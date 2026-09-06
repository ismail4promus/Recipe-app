import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, ClipboardPlus, ChefHat, RefreshCw,
  ShoppingBag, Flame, PackageMinus, DollarSign,
  AlertTriangle, PackageX, Clock3, CheckCircle2,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Order } from '../types';
import { formatCurrency, ANIMATION_VARIANTS } from '../lib/utils';
import { buildAlerts, expiryDate, AlertKind } from '../lib/alerts';
import { LOW_STOCK_PACKAGES } from '../lib/shoppingList';

import SummaryCard from '../components/dashboard/SummaryCard';
import QuickAction from '../components/dashboard/QuickAction';
import AlertItem, { AlertSeverity } from '../components/dashboard/AlertItem';
import TaskRow, { CookingTask } from '../components/dashboard/TaskRow';
import EmptyState from '../components/dashboard/EmptyState';
import Section from '../components/dashboard/Section';
import DashboardSkeleton from '../components/dashboard/Skeletons';
import { CookingStatus } from '../components/dashboard/StatusBadge';

// --- date helpers ---
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const isSameDay = (a?: Date, b?: Date) => !!a && !!b && startOfDay(new Date(a)).getTime() === startOfDay(new Date(b)).getTime();
const daysBetween = (from: Date, to: Date) => Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
const timeLabel = (d?: Date) => {
  if (!d) return undefined;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? undefined : new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(dt);
};

const ALERT_ICON: Record<AlertKind, typeof PackageX> = {
  'out-of-stock': PackageX,
  'low-stock': PackageMinus,
  'expiring': Clock3,
  'expired': Clock3,
  'order-overdue': AlertTriangle,
  'order-urgent': AlertTriangle,
};

const getGreeting = (h: number) => (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
const getUserName = () => {
  try { return localStorage.getItem('chef_name') || 'Chef'; } catch { return 'Chef'; }
};
const getWeekTarget = () => {
  try { return Number(localStorage.getItem('weekly_revenue_target')) || 2000; } catch { return 2000; }
};

const DashboardPage: React.FC = () => {
  const { ingredients, orders, cookingSessions, loading, getRecipeById } = useData();

  // A fresh Date on every render invalidates every memo below it, so the whole
  // dashboard model was being recomputed on each keystroke elsewhere in the
  // tree. One timestamp per mount is what the figures actually need.
  const now = useMemo(() => new Date(), []);
  const greeting = `${getGreeting(now.getHours())}, ${getUserName()}`;
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);

  const model = useMemo(() => {
    const activeStatuses: Order['status'][] = ['pending_approval', 'approved', 'processing'];
    const activeOrders = orders.filter(o => activeStatuses.includes(o.status));
    const todaysOrders = orders.filter(o => activeStatuses.includes(o.status) && isSameDay(o.dueDate, now));

    const criticalStock = ingredients.filter(i => i.packagesInStock === 0);
    const lowStock = ingredients.filter(i => i.packagesInStock > 0 && i.packagesInStock <= LOW_STOCK_PACKAGES);
    const expiring = ingredients
      .map(i => ({ i, days: daysBetween(now, expiryDate(i)) }))
      .filter(x => x.days <= 7)
      .sort((a, b) => a.days - b.days);

    const inProgressSessions = cookingSessions.filter(s => s.status === 'in_progress');

    const completed = orders.filter(o => o.status === 'completed');
    const todaysRevenue = completed
      .filter(o => isSameDay(o.dueDate, now) || (!o.dueDate && isSameDay(o.createdAt, now)))
      .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    const weekStart = startOfDay(new Date(now.getTime() - 6 * 86400000));
    const weekRevenue = completed
      .filter(o => new Date(o.createdAt) >= weekStart)
      .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

    return { activeOrders, todaysOrders, criticalStock, lowStock, expiring, inProgressSessions, todaysRevenue, weekRevenue };
  }, [orders, ingredients, cookingSessions, now]);

  // --- Attention items (urgent first, capped at 6) ---
  // Derived by lib/alerts so the header bell counts exactly what is listed here.
  const allAlerts = useMemo(() => buildAlerts(ingredients, orders, now), [ingredients, orders, now]);
  const alerts = useMemo(
    () => allAlerts.slice(0, 6).map(a => ({
      icon: ALERT_ICON[a.kind],
      severity: a.severity as AlertSeverity,
      title: a.title,
      message: a.message,
      actionLabel: a.actionLabel,
      to: a.to,
    })),
    [allAlerts]
  );

  // --- Today's cooking schedule ---
  const tasks = useMemo(() => {
    const out: CookingTask[] = [];
    const recipeIdsInProgress = new Set(model.inProgressSessions.map(s => s.recipeId));

    model.inProgressSessions.forEach(s => {
      const r = getRecipeById(s.recipeId);
      const status: CookingStatus = s.currentStep > 0 ? 'Cooking' : 'Preparing';
      const end = r ? new Date(new Date(s.startTime).getTime() + ((r.prepTime + r.cookTime) || 0) * 60000) : undefined;
      const stepCount = r?.steps?.length || 0;
      out.push({
        key: `sess-${s.id}`,
        recipeName: r?.name || s.sessionName || 'Cooking session',
        quantity: s.servings,
        startLabel: timeLabel(new Date(s.startTime)),
        endLabel: timeLabel(end),
        status,
        actionLabel: 'Continue',
        to: `/recipes/${s.recipeId}/cook?sessionId=${s.id}`,
        progress: stepCount ? Math.min(1, s.currentStep / stepCount) : 0,
        progressLabel: stepCount ? `Step ${Math.min(s.currentStep + 1, stepCount)}/${stepCount}` : undefined,
      });
    });

    model.activeOrders
      .filter(o => o.status === 'approved' || o.status === 'processing')
      .forEach(o => o.items.forEach(it => {
        if (recipeIdsInProgress.has(it.recipeId)) return;
        const r = getRecipeById(it.recipeId);
        const servings = (r?.servings || 1) * it.quantity;
        out.push({
          key: `ord-${o.id}-${it.recipeId}`,
          recipeName: it.recipeName,
          context: `#${o.orderNumber.slice(-5)} · ${o.customerName}`,
          quantity: it.quantity,
          status: 'Not Started',
          actionLabel: 'Start',
          to: `/recipes/${it.recipeId}/cook?servings=${servings}`,
        });
      }));

    return out.slice(0, 5);
  }, [model, getRecipeById]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-1 pb-20">
        <DashboardSkeleton />
      </div>
    );
  }

  const lowCount = model.lowStock.length + model.criticalStock.length;
  const summaryText = [
    `${model.activeOrders.length} active order${model.activeOrders.length === 1 ? '' : 's'}`,
    `${lowCount} low-stock item${lowCount === 1 ? '' : 's'}`,
    `${model.inProgressSessions.length} cooking task${model.inProgressSessions.length === 1 ? '' : 's'} in progress`,
  ].join(', ');
  const allClear = model.activeOrders.length + lowCount + model.inProgressSessions.length === 0;

  // Thin status bars + weekly target
  const weekTarget = getWeekTarget();
  const targetPct = weekTarget > 0 ? Math.min(100, Math.round((model.weekRevenue / weekTarget) * 100)) : 0;
  const dailyTarget = weekTarget / 7;
  const ordersBar = model.activeOrders.length ? model.todaysOrders.length / model.activeOrders.length : 0;
  const cookingBar = tasks.length ? model.inProgressSessions.length / tasks.length : 0;
  const lowBar = ingredients.length ? lowCount / ingredients.length : 0;
  const revenueBar = dailyTarget > 0 ? model.todaysRevenue / dailyTarget : (model.todaysRevenue > 0 ? 1 : 0);

  return (
    <motion.div
      initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container}
      className="mx-auto max-w-5xl space-y-2.5 px-1 pb-20"
    >
      {/* 1. Welcome + daily summary */}
      <motion.header variants={ANIMATION_VARIANTS.item}>
        {/* Greeting, date and the day's summary on two lines instead of four */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-app-border pb-2">
          <h1 className="text-lg font-bold tracking-tight text-app-text md:text-xl">{greeting}</h1>
          <span className="text-xs text-app-muted">{dateLabel}</span>
          <p className="w-full text-xs text-app-text sm:w-auto sm:border-l sm:border-app-border sm:pl-2">
            {allClear
              ? 'All caught up — nothing needs your attention.'
              : <>You have <span className="font-semibold">{summaryText}</span>.</>}
          </p>
        </div>

        {/* Weekly revenue target — label, figures and progress on one line */}
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-app-border bg-app-card px-2.5 py-1.5">
          <span className="shrink-0 text-xs font-medium text-app-muted">Weekly target</span>
          <div className="h-1.5 flex-1 overflow-hidden bg-app-muted/15">
            <div className={targetPct >= 100 ? 'h-full bg-app-success' : 'h-full bg-app-primary'} style={{ width: `${targetPct}%` }} />
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-app-text">
            {formatCurrency(model.weekRevenue)}
            <span className="font-normal text-app-muted"> / {formatCurrency(weekTarget)} · {targetPct}%</span>
          </span>
        </div>
      </motion.header>

      {/* 2. Quick actions (the four most common) */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        <QuickAction icon={Plus} label="Add Recipe" to="/recipes/new" primary />
        <QuickAction icon={ClipboardPlus} label="Create Order" to="/orders?new=1" />
        <QuickAction icon={ChefHat} label="Start Cooking" to="/recipes" />
        <QuickAction icon={RefreshCw} label="Update Stock" to="/pantry?filter=low" />
      </motion.div>

      {/* 3. Today's overview (each card opens the related page) */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        <SummaryCard
          icon={ShoppingBag} accent="info" title="Today's Orders"
          value={model.todaysOrders.length}
          hint={model.todaysOrders.length ? 'Due for today' : `${model.activeOrders.length} active in total`}
          to="/orders?status=processing" bar={ordersBar}
        />
        <SummaryCard
          icon={Flame} accent="warning" title="Cooking in Progress"
          value={model.inProgressSessions.length}
          hint={model.inProgressSessions.length ? 'On the stove now' : 'Nothing cooking yet'}
          to="/cooking" bar={cookingBar}
        />
        <SummaryCard
          icon={PackageMinus} accent={model.criticalStock.length ? 'danger' : 'warning'} title="Low-Stock Items"
          value={lowCount}
          hint={model.criticalStock.length ? `${model.criticalStock.length} out of stock` : 'At or below minimum'}
          to="/pantry?filter=low" bar={lowBar}
        />
        <SummaryCard
          icon={DollarSign} accent="success" title="Today's Revenue"
          value={formatCurrency(model.todaysRevenue)}
          hint={`${formatCurrency(model.weekRevenue)} this week`}
          to="/analytics" bar={revenueBar}
        />
      </motion.div>

      {/* 4. Attention required */}
      <motion.div variants={ANIMATION_VARIANTS.item}>
        <Section title="Attention Required" icon={AlertTriangle} count={allAlerts.length} countTone={model.criticalStock.length ? 'danger' : 'warning'}>
          {alerts.length ? (
            <div className="space-y-2">
              {alerts.map((a, i) => <AlertItem key={i} {...a} />)}
            </div>
          ) : (
            <EmptyState icon={CheckCircle2} title="Nothing needs attention" message="Stock, orders, and cooking are all on track." compact />
          )}
        </Section>
      </motion.div>

      {/* 5. Today's cooking */}
      <motion.div variants={ANIMATION_VARIANTS.item}>
        <Section title="Today's Cooking" icon={ChefHat} action={{ label: 'View All', to: '/cooking' }}>
          {tasks.length ? (
            <div className="divide-y divide-app-border">
              {tasks.map(t => <TaskRow key={t.key} task={t} />)}
            </div>
          ) : (
            <EmptyState icon={ChefHat} title="No cooking scheduled" message="Approve an order or start a recipe to begin." actionLabel="Browse Recipes" to="/recipes" compact />
          )}
        </Section>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;

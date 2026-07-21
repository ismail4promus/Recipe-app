import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, ClipboardPlus, ChefHat, RefreshCw,
  ShoppingBag, Flame, PackageMinus, DollarSign,
  AlertTriangle, PackageX, Clock3, CheckCircle2,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Ingredient, Order } from '../types';
import { formatCurrency, ANIMATION_VARIANTS } from '../lib/utils';

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
const expiryDate = (i: Ingredient) => { const e = new Date(i.last_verified || new Date()); e.setDate(e.getDate() + (i.shelf_life_days || 365)); return e; };
const timeLabel = (d?: Date) => {
  if (!d) return undefined;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? undefined : new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(dt);
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

  const now = new Date();
  const greeting = `${getGreeting(now.getHours())}, ${getUserName()}`;
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);

  const model = useMemo(() => {
    const activeStatuses: Order['status'][] = ['pending_approval', 'approved', 'processing'];
    const activeOrders = orders.filter(o => activeStatuses.includes(o.status));
    const todaysOrders = orders.filter(o => activeStatuses.includes(o.status) && isSameDay(o.dueDate, now));

    const criticalStock = ingredients.filter(i => i.packagesInStock === 0);
    const lowStock = ingredients.filter(i => i.packagesInStock > 0 && i.packagesInStock <= 2);
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
  const alerts = useMemo(() => {
    const list: (React.ComponentProps<typeof AlertItem> & { sev: number })[] = [];
    const sevRank: Record<AlertSeverity, number> = { urgent: 0, warning: 1, info: 2 };

    model.criticalStock.forEach(i => list.push({
      sev: sevRank.urgent, icon: PackageX, severity: 'urgent',
      title: i.name, message: 'Out of stock — restock to keep cooking.',
      actionLabel: 'Update Stock', to: '/pantry?filter=low',
    }));
    model.lowStock.forEach(i => list.push({
      sev: sevRank.warning, icon: PackageMinus, severity: 'warning',
      title: i.name, message: `Running low — ${i.packagesInStock} ${i.packageUnit} left, below minimum.`,
      actionLabel: 'Update Stock', to: '/pantry?filter=low',
    }));
    model.expiring.forEach(({ i, days }) => list.push({
      sev: days < 0 ? sevRank.urgent : sevRank.warning, icon: Clock3,
      severity: days < 0 ? 'urgent' : 'warning',
      title: i.name,
      message: days < 0 ? 'Expired — check before use.' : days === 0 ? 'Expires today.' : `Expires in ${days} day${days === 1 ? '' : 's'}.`,
      actionLabel: 'View Ingredient', to: '/pantry?filter=expiring',
    }));
    orders.forEach(o => {
      const overdue = o.dueDate && daysBetween(now, new Date(o.dueDate)) < 0 && ['approved', 'processing', 'pending_approval'].includes(o.status);
      const urgent = o.priority === 'high' && ['approved', 'processing', 'pending_approval'].includes(o.status);
      if (overdue || urgent) {
        list.push({
          sev: sevRank.urgent, icon: AlertTriangle, severity: 'urgent',
          title: `Order #${o.orderNumber.slice(-5)} — ${o.customerName}`,
          message: overdue ? 'Past its due date and not completed yet.' : 'Marked high priority — needs attention.',
          actionLabel: 'View Order', to: `/orders?q=${encodeURIComponent(o.orderNumber)}`,
        });
      }
    });

    return list.sort((a, b) => a.sev - b.sev).slice(0, 6);
  }, [model, orders, now]);

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
      className="mx-auto max-w-5xl space-y-4 px-1 pb-20"
    >
      {/* 1. Welcome + daily summary */}
      <motion.header variants={ANIMATION_VARIANTS.item}>
        <h1 className="text-xl font-bold tracking-tight text-app-text md:text-2xl">{greeting}</h1>
        <p className="mt-1 text-sm text-app-muted">{dateLabel}</p>
        <p className="mt-2 text-sm text-app-text">
          {allClear
            ? 'All caught up — nothing needs your attention right now.'
            : <>You have <span className="font-semibold">{summaryText}</span>.</>}
        </p>

        {/* Weekly revenue target */}
        <div className="mt-3 rounded-md border border-app-border bg-app-card p-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-app-muted">Weekly revenue target</span>
            <span className="font-semibold tabular-nums text-app-text">
              {formatCurrency(model.weekRevenue)} <span className="font-normal text-app-muted">/ {formatCurrency(weekTarget)}</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-app-muted/15">
            <div className={targetPct >= 100 ? 'h-full bg-app-success' : 'h-full bg-app-primary'} style={{ width: `${targetPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-app-muted">{targetPct}% of this week's target</p>
        </div>
      </motion.header>

      {/* 2. Quick actions (the four most common) */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickAction icon={Plus} label="Add Recipe" to="/recipes/new" primary />
        <QuickAction icon={ClipboardPlus} label="Create Order" to="/orders?new=1" />
        <QuickAction icon={ChefHat} label="Start Cooking" to="/recipes" />
        <QuickAction icon={RefreshCw} label="Update Stock" to="/pantry?filter=low" />
      </motion.div>

      {/* 3. Today's overview (each card opens the related page) */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <Section title="Attention Required" icon={AlertTriangle} count={alerts.length} countTone={model.criticalStock.length ? 'danger' : 'warning'}>
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

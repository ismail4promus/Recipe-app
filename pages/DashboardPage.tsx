import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, ClipboardPlus, PackagePlus, ChefHat, RefreshCw,
  ShoppingBag, Flame, PackageMinus, DollarSign,
  AlertTriangle, CalendarClock, Boxes, TrendingUp,
  PackageX, Clock3, PartyPopper, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';
import { Recipe, Ingredient, Order } from '../types';
import { formatCurrency, ANIMATION_VARIANTS } from '../lib/utils';

import SummaryCard from '../components/dashboard/SummaryCard';
import QuickAction from '../components/dashboard/QuickAction';
import AlertItem, { AlertSeverity } from '../components/dashboard/AlertItem';
import TaskRow, { CookingTask } from '../components/dashboard/TaskRow';
import OrderRow from '../components/dashboard/OrderRow';
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

// Estimated raw ingredient cost of one batch of a recipe, using real ingredient costs.
const estimateRecipeCost = (recipe: Recipe, getIng: (id: string) => Ingredient | undefined) => {
  let total = 0;
  recipe.ingredientSections?.forEach(sec => sec.ingredients?.forEach(ri => {
    const unitCost = ri.manualCostPerUnit ?? getIng(ri.ingredientId)?.costPerUnit ?? 0;
    total += (ri.quantity || 0) * unitCost;
  }));
  return total;
};

const DashboardPage: React.FC = () => {
  const { recipes, ingredients, orders, cookingSessions, loading, getRecipeById, getIngredientById } = useData();

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

    // Revenue
    const completed = orders.filter(o => o.status === 'completed');
    const todaysRevenue = completed
      .filter(o => isSameDay(o.dueDate, now) || (!o.dueDate && isSameDay(o.createdAt, now)))
      .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    const weekStart = startOfDay(new Date(now.getTime() - 6 * 86400000));
    const weekOrders = completed.filter(o => new Date(o.createdAt) >= weekStart);
    const weekRevenue = weekOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

    // Estimated food cost / profit for the week (real ingredient costs)
    let weekFoodCost = 0;
    weekOrders.forEach(o => o.items.forEach(it => {
      const r = getRecipeById(it.recipeId);
      if (r) {
        const batchCost = estimateRecipeCost(r, getIngredientById);
        const perServing = r.servings > 0 ? batchCost / r.servings : batchCost;
        weekFoodCost += perServing * it.quantity;
      }
    }));
    const weekProfit = weekRevenue - weekFoodCost;
    const margin = weekRevenue > 0 ? Math.round((weekProfit / weekRevenue) * 100) : 0;

    // 7-day revenue sparkline
    const spark = Array.from({ length: 7 }).map((_, idx) => {
      const day = startOfDay(new Date(now.getTime() - (6 - idx) * 86400000));
      const v = completed
        .filter(o => isSameDay(o.createdAt, day))
        .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      return { v };
    });

    const inventoryValue = ingredients.reduce((s, i) => s + i.costPerPackage * i.packagesInStock, 0);

    return {
      activeOrders, todaysOrders, criticalStock, lowStock, expiring, inProgressSessions,
      completed, todaysRevenue, weekRevenue, weekFoodCost, weekProfit, margin, spark, inventoryValue,
    };
  }, [orders, ingredients, cookingSessions, getRecipeById, getIngredientById, now]);

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
    // Overdue / urgent orders
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
      out.push({
        key: `sess-${s.id}`,
        recipeName: r?.name || s.sessionName || 'Cooking session',
        quantity: s.servings,
        startLabel: timeLabel(new Date(s.startTime)),
        endLabel: timeLabel(end),
        status,
        actionLabel: 'Continue',
        to: `/recipes/${s.recipeId}/cook?sessionId=${s.id}`,
      });
    });

    // Upcoming: items from active orders not already cooking
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

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [orders]
  );

  const topInventoryAlerts = useMemo(
    () => [...model.criticalStock, ...model.lowStock].slice(0, 3),
    [model]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-1 pb-24">
        <DashboardSkeleton />
      </div>
    );
  }

  const summaryText = [
    `${model.activeOrders.length} active order${model.activeOrders.length === 1 ? '' : 's'}`,
    `${model.lowStock.length + model.criticalStock.length} low-stock item${model.lowStock.length + model.criticalStock.length === 1 ? '' : 's'}`,
    `${model.inProgressSessions.length} cooking task${model.inProgressSessions.length === 1 ? '' : 's'} in progress`,
  ].join(', ');

  const attentionCount = alerts.length;

  return (
    <motion.div
      initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container}
      className="mx-auto max-w-7xl space-y-6 px-1 pb-24"
    >
      {/* 1. Welcome + daily summary */}
      <motion.header variants={ANIMATION_VARIANTS.item}>
        <h1 className="text-2xl font-bold tracking-tight text-app-text">{greeting}</h1>
        <p className="mt-1 text-sm text-app-muted">{dateLabel}</p>
        <p className="mt-2 text-sm text-app-text">
          {model.activeOrders.length + model.lowStock.length + model.criticalStock.length + model.inProgressSessions.length === 0
            ? 'All caught up — nothing needs your attention right now.'
            : <>You have <span className="font-semibold">{summaryText}</span>.</>}
        </p>
      </motion.header>

      {/* 2. Quick actions */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <QuickAction icon={Plus} label="Add Recipe" to="/recipes/new" primary />
        <QuickAction icon={ClipboardPlus} label="Create Order" to="/orders?new=1" />
        <QuickAction icon={PackagePlus} label="Add Inventory Item" to="/pantry?add=1" />
        <QuickAction icon={ChefHat} label="Start Cooking" to="/recipes" />
        <QuickAction icon={RefreshCw} label="Update Stock" to="/pantry?filter=low" />
      </motion.div>

      {/* 3. Today's overview */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          icon={ShoppingBag} accent="info" title="Today's Orders"
          value={model.todaysOrders.length}
          hint={model.todaysOrders.length ? 'Due for today' : `${model.activeOrders.length} active in total`}
          to="/orders?status=processing"
        />
        <SummaryCard
          icon={Flame} accent="warning" title="Cooking in Progress"
          value={model.inProgressSessions.length}
          hint={model.inProgressSessions.length ? 'On the stove now' : 'Nothing cooking yet'}
          to="/cooking"
        />
        <SummaryCard
          icon={PackageMinus} accent={model.criticalStock.length ? 'danger' : 'warning'} title="Low-Stock Items"
          value={model.lowStock.length + model.criticalStock.length}
          hint={model.criticalStock.length ? `${model.criticalStock.length} out of stock` : 'At or below minimum'}
          to="/pantry?filter=low"
        />
        <SummaryCard
          icon={DollarSign} accent="success" title="Today's Revenue"
          value={formatCurrency(model.todaysRevenue)}
          hint={`${formatCurrency(model.weekRevenue)} this week`}
          to="/analytics"
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* 4. Attention required */}
          <motion.div variants={ANIMATION_VARIANTS.item}>
            <Section title="Attention Required" icon={AlertTriangle} count={attentionCount} countTone={model.criticalStock.length ? 'danger' : 'warning'}>
              {alerts.length ? (
                <div className="space-y-2">
                  {alerts.map((a, i) => <AlertItem key={i} {...a} />)}
                </div>
              ) : (
                <EmptyState icon={CheckCircle2} title="Nothing needs attention" message="Stock, orders, and cooking are all on track." compact />
              )}
            </Section>
          </motion.div>

          {/* 5. Today's cooking schedule */}
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

          {/* 6. Recent orders */}
          <motion.div variants={ANIMATION_VARIANTS.item}>
            <Section title="Recent Orders" icon={ShoppingBag} action={{ label: 'View All Orders', to: '/orders' }}>
              {recentOrders.length ? (
                <div className="divide-y divide-app-border">
                  {recentOrders.map(o => <OrderRow key={o.id} order={o} to={`/orders?q=${encodeURIComponent(o.orderNumber)}`} />)}
                </div>
              ) : (
                <EmptyState icon={ShoppingBag} title="No orders yet" message="Create your first order to get started." actionLabel="Create Order" to="/orders?new=1" compact />
              )}
            </Section>
          </motion.div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* 7. Inventory snapshot */}
          <motion.div variants={ANIMATION_VARIANTS.item}>
            <Section title="Inventory" icon={Boxes} action={{ label: 'View Inventory', to: '/pantry' }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-xs text-app-muted">Total Items</p>
                  <p className="mt-0.5 text-xl font-bold text-app-text tabular-nums">{ingredients.length}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-xs text-app-muted">Est. Value</p>
                  <p className="mt-0.5 text-xl font-bold text-app-text tabular-nums">{formatCurrency(model.inventoryValue)}</p>
                </div>
                <div className="rounded-lg bg-app-warning/10 p-3">
                  <p className="text-xs text-app-warning">Low Stock</p>
                  <p className="mt-0.5 text-xl font-bold text-app-warning tabular-nums">{model.lowStock.length + model.criticalStock.length}</p>
                </div>
                <div className="rounded-lg bg-app-danger/10 p-3">
                  <p className="text-xs text-app-danger">Expiring Soon</p>
                  <p className="mt-0.5 text-xl font-bold text-app-danger tabular-nums">{model.expiring.length}</p>
                </div>
              </div>
              {topInventoryAlerts.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {topInventoryAlerts.map(i => (
                    <Link key={i.id} to="/pantry?filter=low" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                      <span className="truncate text-app-text">{i.name}</span>
                      <span className={`shrink-0 text-xs font-semibold ${i.packagesInStock === 0 ? 'text-app-danger' : 'text-app-warning'} tabular-nums`}>
                        {i.packagesInStock} {i.packageUnit}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Section>
          </motion.div>

          {/* 8. Business snapshot */}
          <motion.div variants={ANIMATION_VARIANTS.item}>
            <Section title="Business" icon={TrendingUp} action={{ label: 'Insights', to: '/analytics' }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-app-muted">Today's Revenue</p>
                  <p className="mt-0.5 text-lg font-bold text-app-text tabular-nums">{formatCurrency(model.todaysRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-app-muted">This Week</p>
                  <p className="mt-0.5 text-lg font-bold text-app-text tabular-nums">{formatCurrency(model.weekRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-app-muted">Est. Food Cost</p>
                  <p className="mt-0.5 text-lg font-bold text-app-text tabular-nums">{formatCurrency(model.weekFoodCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-app-muted">Est. Profit</p>
                  <p className="mt-0.5 text-lg font-bold text-app-success tabular-nums">
                    {formatCurrency(model.weekProfit)}
                    {model.margin > 0 && <span className="ml-1 text-xs font-semibold text-app-muted">· {model.margin}%</span>}
                  </p>
                </div>
              </div>
              {model.weekRevenue > 0 && (
                <div className="mt-3 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={model.spark} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2} fill="url(#rev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="mt-1 text-center text-xs text-app-muted">Revenue, last 7 days</p>
                </div>
              )}
            </Section>
          </motion.div>

          {/* Detailed reports pointer */}
          <motion.div variants={ANIMATION_VARIANTS.item}>
            <Link to="/analytics" className="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3 text-sm text-app-text transition-colors hover:border-app-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
              <span className="inline-flex items-center gap-2"><PartyPopper className="h-4 w-4 text-app-primary" /> Full reports &amp; analysis</span>
              <ArrowRight className="h-4 w-4 text-app-muted" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Flame, ListChecks, History } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ANIMATION_VARIANTS } from '../lib/utils';
import Section from '../components/dashboard/Section';
import TaskRow, { CookingTask } from '../components/dashboard/TaskRow';
import EmptyState from '../components/dashboard/EmptyState';
import { CookingStatus } from '../components/dashboard/StatusBadge';

const timeLabel = (d?: Date) => {
  if (!d) return undefined;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? undefined : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(dt);
};

const CookingPage: React.FC = () => {
  const { cookingSessions, orders, getRecipeById } = useData();

  const { active, upcoming, recent } = useMemo(() => {
    const inProgress = cookingSessions.filter(s => s.status === 'in_progress');
    const recipeIdsInProgress = new Set(inProgress.map(s => s.recipeId));

    const active: CookingTask[] = inProgress.map(s => {
      const r = getRecipeById(s.recipeId);
      const status: CookingStatus = s.currentStep > 0 ? 'Cooking' : 'Preparing';
      const stepCount = r?.steps?.length || 0;
      return {
        key: `sess-${s.id}`,
        recipeName: r?.name || s.sessionName || 'Cooking session',
        quantity: s.servings,
        startLabel: timeLabel(new Date(s.startTime)),
        status,
        actionLabel: 'Continue',
        to: `/recipes/${s.recipeId}/cook?sessionId=${s.id}`,
        progress: stepCount ? Math.min(1, s.currentStep / stepCount) : 0,
        progressLabel: stepCount ? `Step ${Math.min(s.currentStep + 1, stepCount)}/${stepCount}` : undefined,
      };
    });

    const upcoming: CookingTask[] = [];
    orders.filter(o => o.status === 'approved' || o.status === 'processing').forEach(o =>
      o.items.forEach(it => {
        if (recipeIdsInProgress.has(it.recipeId)) return;
        const r = getRecipeById(it.recipeId);
        const servings = (r?.servings || 1) * it.quantity;
        upcoming.push({
          key: `ord-${o.id}-${it.recipeId}`,
          recipeName: it.recipeName,
          context: `#${o.orderNumber.slice(-5)} · ${o.customerName}`,
          quantity: it.quantity,
          status: 'Not Started',
          actionLabel: 'Start',
          to: `/recipes/${it.recipeId}/cook?servings=${servings}`,
        });
      })
    );

    const recent: CookingTask[] = cookingSessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 8)
      .map(s => {
        const r = getRecipeById(s.recipeId);
        return {
          key: `done-${s.id}`,
          recipeName: r?.name || s.sessionName || 'Cooking session',
          quantity: s.servings,
          startLabel: timeLabel(new Date(s.startTime)),
          status: 'Completed' as CookingStatus,
          actionLabel: 'View Details',
          to: `/recipes/${s.recipeId}/logs`,
        };
      });

    return { active, upcoming, recent };
  }, [cookingSessions, orders, getRecipeById]);

  return (
    <motion.div
      initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container}
      className="mx-auto max-w-5xl space-y-4 px-1 pb-20"
    >
      <motion.header variants={ANIMATION_VARIANTS.item}>
        <h1 className="text-2xl font-bold tracking-tight text-app-text">Cooking</h1>
        <p className="mt-1 text-sm text-app-muted">What's on the stove and what's coming up next.</p>
      </motion.header>

      <motion.div variants={ANIMATION_VARIANTS.item}>
        <Section title="In Progress" icon={Flame} count={active.length} countTone="warning">
          {active.length ? (
            <div className="divide-y divide-app-border">{active.map(t => <TaskRow key={t.key} task={t} />)}</div>
          ) : (
            <EmptyState icon={Flame} title="Nothing cooking right now" message="Start a task from an order or recipe." compact />
          )}
        </Section>
      </motion.div>

      <motion.div variants={ANIMATION_VARIANTS.item}>
        <Section title="Up Next" icon={ListChecks} count={upcoming.length}>
          {upcoming.length ? (
            <div className="divide-y divide-app-border">{upcoming.map(t => <TaskRow key={t.key} task={t} />)}</div>
          ) : (
            <EmptyState icon={ListChecks} title="No upcoming cooking" message="Approve an order to queue it here." actionLabel="View Orders" to="/orders" compact />
          )}
        </Section>
      </motion.div>

      <motion.div variants={ANIMATION_VARIANTS.item}>
        <Section title="Recently Completed" icon={History}>
          {recent.length ? (
            <div className="divide-y divide-app-border">{recent.map(t => <TaskRow key={t.key} task={t} />)}</div>
          ) : (
            <EmptyState icon={ChefHat} title="No cooking history yet" message="Completed sessions will show here." compact />
          )}
        </Section>
      </motion.div>
    </motion.div>
  );
};

export default CookingPage;

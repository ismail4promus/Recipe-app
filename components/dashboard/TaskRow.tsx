import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChefHat } from 'lucide-react';
import { CookingStatusBadge, CookingStatus } from './StatusBadge';

export interface CookingTask {
  key: string;
  recipeName: string;
  context?: string; // order # / customer
  quantity: number;
  startLabel?: string;
  endLabel?: string;
  status: CookingStatus;
  actionLabel: string;
  to: string;
  progress?: number;      // 0..1 — shows a thin status bar
  progressLabel?: string; // e.g. "Step 3/8"
}

const TaskRow: React.FC<{ task: CookingTask }> = ({ task }) => {
  const hasProgress = task.progress !== undefined;
  const pct = Math.round(Math.min(1, Math.max(0, task.progress ?? 0)) * 100);
  return (
    <div className="py-2.5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-app-primary/10 text-app-primary">
          <ChefHat className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-app-text">{task.recipeName}</p>
            <span className="shrink-0 rounded-sm bg-app-muted/10 px-1.5 py-0.5 text-xs font-semibold text-app-muted tabular-nums">
              ×{task.quantity}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-app-muted">
            {task.context && <span className="truncate">{task.context}</span>}
            {(task.startLabel || task.endLabel) && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <Clock className="h-3 w-3" />
                {task.startLabel}
                {task.endLabel ? ` – ${task.endLabel}` : ''}
              </span>
            )}
          </div>
        </div>
        <CookingStatusBadge status={task.status} className="hidden sm:inline-flex" />
        <Link
          to={task.to}
          className="shrink-0 rounded-md bg-app-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
        >
          {task.actionLabel}
        </Link>
      </div>

      {hasProgress && (
        <div className="mt-2 flex items-center gap-2 pl-[52px]">
          <div className="h-1 flex-1 overflow-hidden rounded-sm bg-app-muted/15">
            <div
              className={pct >= 100 ? 'h-full bg-app-success' : 'h-full bg-app-primary'}
              style={{ width: `${pct}%` }}
            />
          </div>
          {task.progressLabel && (
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-app-muted">{task.progressLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskRow;

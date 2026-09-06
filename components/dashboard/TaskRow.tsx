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
    // Progress rides along the meta line instead of claiming a row of its own.
    <div className="py-1.5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-app-primary/10 text-app-primary">
          <ChefHat className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13px] font-semibold leading-tight text-app-text">{task.recipeName}</p>
            <span className="shrink-0 bg-app-muted/10 px-1 text-[11px] font-semibold text-app-muted tabular-nums">
              ×{task.quantity}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] leading-tight text-app-muted">
            {task.context && <span className="truncate">{task.context}</span>}
            {(task.startLabel || task.endLabel) && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <Clock className="h-3 w-3" />
                {task.startLabel}
                {task.endLabel ? ` – ${task.endLabel}` : ''}
              </span>
            )}
            {hasProgress && (
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="h-1 min-w-[40px] flex-1 overflow-hidden bg-app-muted/15">
                  <span
                    className={pct >= 100 ? 'block h-full bg-app-success' : 'block h-full bg-app-primary'}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                {task.progressLabel && (
                  <span className="shrink-0 font-medium tabular-nums">{task.progressLabel}</span>
                )}
              </span>
            )}
          </div>
        </div>
        <CookingStatusBadge status={task.status} className="hidden sm:inline-flex" />
        <Link
          to={task.to}
          className="shrink-0 rounded-full bg-app-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
        >
          {task.actionLabel}
        </Link>
      </div>
    </div>
  );
};

export default TaskRow;

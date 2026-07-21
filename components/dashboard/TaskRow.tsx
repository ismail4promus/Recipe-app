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
}

const TaskRow: React.FC<{ task: CookingTask }> = ({ task }) => (
  <div className="flex items-center gap-3 py-3">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-app-primary/10 text-app-primary">
      <ChefHat className="h-5 w-5" />
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="truncate text-sm font-semibold text-app-text">{task.recipeName}</p>
        <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-xs font-semibold text-app-muted tabular-nums">
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
      className="shrink-0 rounded-lg bg-app-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
    >
      {task.actionLabel}
    </Link>
  </div>
);

export default TaskRow;

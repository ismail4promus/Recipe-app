import React from 'react';
import { OrderStatus, OrderPriority } from '../../types';
import { cn } from '../../lib/utils';
import { Clock, Utensils, X, Zap, ShieldAlert, PackageCheck, Activity, Circle } from 'lucide-react';

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
    const config: Record<OrderStatus, { color: string; icon: any; label: string }> = {
        pending_approval: { color: 'text-app-warning bg-app-warning/15', icon: Clock, label: 'Pending' },
        approved: { color: 'text-app-info bg-app-info/15', icon: Activity, label: 'Approved' },
        processing: { color: 'text-app-info bg-app-info/15', icon: Utensils, label: 'In Progress' },
        completed: { color: 'text-app-success bg-app-success/15', icon: PackageCheck, label: 'Completed' },
        cancelled: { color: 'text-app-danger bg-app-danger/15', icon: X, label: 'Cancelled' },
    };
    const { color, icon: Icon, label } = config[status];
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold", color)}>
            <Icon className="h-3 w-3" /> {label}
        </span>
    );
};

export const PriorityBadge: React.FC<{ priority: OrderPriority }> = ({ priority }) => {
    const config = {
        low: { color: 'text-app-muted bg-app-muted/10', icon: Circle, label: 'Low' },
        normal: { color: 'text-app-info bg-app-info/15', icon: Zap, label: 'Normal' },
        high: { color: 'text-app-danger bg-app-danger/15', icon: ShieldAlert, label: 'Urgent' },
    };

    const safePriority = (priority && config[priority]) ? priority : 'normal';
    const { color, icon: Icon, label } = config[safePriority as keyof typeof config];

    return (
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold", color)}>
            <Icon className="h-2.5 w-2.5" /> {label}
        </span>
    );
};

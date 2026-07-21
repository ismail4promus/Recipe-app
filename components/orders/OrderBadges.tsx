import React from 'react';
import { OrderStatus, OrderPriority } from '../../types';
import { cn } from '../../lib/utils';
import { Clock, CheckCircle2, Utensils, X, AlertCircle, Zap, ShieldAlert, PackageCheck, ListOrdered, Activity, Crosshair } from 'lucide-react';

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
    const config: Record<OrderStatus, { color: string; pulse: string; icon: any; label: string }> = {
        pending_approval: { color: 'text-app-warning border-app-warning/20 bg-app-warning/5', pulse: 'bg-app-warning', icon: Clock, label: 'QUEUED_STBY' },
        approved: { color: 'text-app-primary border-app-primary/20 bg-app-primary/5', pulse: 'bg-app-primary shadow-[0_0_8px_#10b981]', icon: Activity, label: 'ACTIVE_EXEC' },
        processing: { color: 'text-app-primary border-app-primary/20 bg-app-primary/10', pulse: 'bg-app-primary animate-pulse shadow-[0_0_10px_#10b981]', icon: Utensils, label: 'FIRING_NODE' },
        completed: { color: 'text-app-success border-app-success/20 bg-app-success/5', pulse: 'bg-app-success', icon: PackageCheck, label: 'MISSION_DONE' },
        cancelled: { color: 'text-app-danger border-app-danger/20 bg-app-danger/5', pulse: 'bg-app-danger', icon: X, label: 'HALTED_ERR' },
    };
    const { color, pulse, icon: Icon, label } = config[status];
    return (
        <span className={cn("flex items-center gap-2 px-2.5 py-1 rounded-sm text-[8px] font-black uppercase tracking-[0.2em] border tabular-nums", color)}>
            <span className={cn("status-pulse", pulse)}></span>
            <Icon className="h-2.5 w-2.5 opacity-70" /> {label}
        </span>
    );
};

export const PriorityBadge: React.FC<{ priority: OrderPriority }> = ({ priority }) => {
    const config = {
        low: { color: 'text-app-muted border-white/5 bg-white/5', icon: Crosshair, label: 'STND' },
        normal: { color: 'text-app-primary border-app-primary/20 bg-app-primary/5', icon: Zap, label: 'PRIO' },
        high: { color: 'text-app-danger border-app-danger/30 bg-app-danger/10 animate-pulse', icon: ShieldAlert, label: 'CRIT' },
    };
    
    const safePriority = (priority && config[priority]) ? priority : 'normal';
    const { color, icon: Icon, label } = config[safePriority as keyof typeof config];
    
    return (
        <span className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[7px] font-black uppercase tracking-widest border", color)}>
            <Icon className="h-2 w-2" /> {label}
        </span>
    );
};
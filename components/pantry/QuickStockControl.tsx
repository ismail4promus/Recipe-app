import React from 'react';
import { Ingredient } from '../../types';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export const QuickStockControl: React.FC<{
    item: Ingredient;
    onUpdate: (item: Ingredient) => void;
    className?: string;
}> = ({ item, onUpdate, className }) => {
    const handleAdjust = (e: React.MouseEvent, amount: number) => {
        e.stopPropagation();
        const newStock = Math.max(0, item.packagesInStock + amount);
        const updated = {
            ...item,
            packagesInStock: newStock,
            quantityInStock: newStock * item.packageSize,
            last_verified: amount > 0 ? new Date() : item.last_verified
        };
        onUpdate(updated);
    };

    return (
        <div className={cn("flex items-center bg-muted/20 rounded-md border border-border/60 p-0.5 shadow-inner", className)} onClick={e => e.stopPropagation()}>
            <button 
                onClick={(e) => handleAdjust(e, -1)}
                className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-white dark:hover:bg-zinc-800 text-muted-foreground hover:text-red-500 transition-all active:scale-90"
            >
                <Minus className="h-2.5 w-2.5" strokeWidth={4} />
            </button>
            <div className="flex-1 text-center flex items-baseline justify-center gap-0.5 px-1 min-w-[32px]">
                <span className="font-black text-[10px] tabular-nums text-foreground">{item.packagesInStock}</span>
                <span className="text-[6px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">{item.packageUnit.slice(0,2)}</span>
            </div>
            <button 
                onClick={(e) => handleAdjust(e, 1)}
                className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-white dark:hover:bg-zinc-800 text-muted-foreground hover:text-emerald-500 transition-all active:scale-90"
            >
                <Plus className="h-2.5 w-2.5" strokeWidth={4} />
            </button>
        </div>
    );
};
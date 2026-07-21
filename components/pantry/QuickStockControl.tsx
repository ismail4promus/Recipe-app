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
        <div className={cn("flex items-center bg-app-elevated rounded-full border border-app-border p-0.5", className)} onClick={e => e.stopPropagation()}>
            <button
                onClick={(e) => handleAdjust(e, -1)}
                aria-label="Decrease stock"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-app-muted/10 text-app-muted hover:text-app-danger transition-all active:scale-90"
            >
                <Minus className="h-2.5 w-2.5" strokeWidth={4} />
            </button>
            <div className="flex-1 text-center flex items-baseline justify-center gap-0.5 px-1 min-w-[32px]">
                <span className="font-semibold text-xs tabular-nums text-app-text">{item.packagesInStock}</span>
                <span className="text-[8px] text-app-muted font-medium tracking-tight opacity-70">{item.packageUnit.slice(0,2)}</span>
            </div>
            <button
                onClick={(e) => handleAdjust(e, 1)}
                aria-label="Increase stock"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-app-muted/10 text-app-muted hover:text-app-success transition-all active:scale-90"
            >
                <Plus className="h-2.5 w-2.5" strokeWidth={4} />
            </button>
        </div>
    );
};
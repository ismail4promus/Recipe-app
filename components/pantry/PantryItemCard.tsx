import React from 'react';
import { Ingredient } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { CheckSquare, Edit, Clock, Shield } from 'lucide-react';
import { QuickStockControl } from './QuickStockControl';

const getDaysRemaining = (item: Ingredient) => {
    if (!item.last_verified) return 999;
    const lastVerified = new Date(item.last_verified);
    const expiryDate = new Date(lastVerified);
    expiryDate.setDate(expiryDate.getDate() + (item.shelf_life_days || 365));
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Dairy': return '🥛';
        case 'Vegetable': return '🥬';
        case 'Protein': return '🥩';
        case 'Spices': return '🌶️';
        case 'Grains': return '🌾';
        case 'Oils & Fats': return '🫒';
        case 'Condiments': return '🧂';
        case 'Fruit': return '🍎';
        case 'Baking': return '🥖';
        case 'Beverage': return '🥤';
        default: return '📦';
    }
};

export const PantryItemCard: React.FC<{
    item: Ingredient;
    onEdit: (item: Ingredient) => void;
    isSelected: boolean;
    isSelectionMode: boolean;
    onToggleSelect: (id: string) => void;
    onUpdate: (item: Ingredient) => void;
    viewMode?: 'grid' | 'list';
}> = React.memo(({ item, onEdit, isSelected, isSelectionMode, onToggleSelect, onUpdate, viewMode = 'grid' }) => {
    const daysRemaining = getDaysRemaining(item);
    const isExpired = daysRemaining < 0;
    const isExpiringSoon = daysRemaining <= 7 && !isExpired;
    const isLowStock = item.packagesInStock <= 2;

    if (viewMode === 'list') {
        return (
            <div 
                onClick={() => isSelectionMode ? onToggleSelect(item.id) : onEdit(item)}
                className={cn(
                    "group relative flex items-center gap-4 p-3 bg-app-card border rounded-xl hover:border-app-primary/40 transition-all select-none shadow-soft overflow-hidden",
                    isSelected ? "border-app-primary bg-app-primary/10" : "border-app-border",
                    isLowStock && "border-l-4 border-l-app-warning"
                )}
            >
                <div className="h-10 w-10 rounded-xl bg-app-elevated flex items-center justify-center text-lg shrink-0 border border-app-border">
                    {getCategoryIcon(item.category)}
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-between gap-6">
                    <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm text-app-text truncate tracking-tight leading-none mb-1.5">{item.name}</h4>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-app-muted">{item.category}</span>
                            <span className="text-xs font-medium text-app-primary tabular-nums">{formatCurrency(item.costPerUnit)} / unit</span>
                        </div>
                    </div>

                    <div className="hidden sm:block shrink-0 px-4 border-x border-app-border">
                        <div className={cn(
                            "flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border",
                            isExpired ? "text-app-danger border-app-danger/30 bg-app-danger/10" : isExpiringSoon ? "text-app-warning border-app-warning/30 bg-app-warning/10" : "text-app-success border-app-success/30 bg-app-success/10"
                        )}>
                            <Clock className="h-3 w-3" />
                            {daysRemaining < 0 ? 'Expired' : `${daysRemaining}d left`}
                        </div>
                    </div>

                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <QuickStockControl item={item} onUpdate={onUpdate} className="h-10 min-w-[100px]" />
                        {isSelectionMode && (
                             <div className={cn(
                                 "h-10 w-10 rounded-full flex items-center justify-center transition-colors border",
                                 isSelected ? "bg-app-primary border-app-primary text-primary-foreground" : "bg-transparent border-app-border"
                             )}>
                                {isSelected && <CheckSquare className="h-4 w-4" />}
                             </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={() => isSelectionMode ? onToggleSelect(item.id) : onEdit(item)}
            className={cn(
                "group relative bg-app-card rounded-2xl transition-all duration-200 border select-none overflow-hidden h-full flex flex-col shadow-soft",
                isSelected ? "border-app-primary bg-app-primary/10" : "border-app-border hover:border-app-primary/30",
                isLowStock && "border-t-2 border-t-app-warning"
            )}
        >
            <div className="p-4 flex flex-col h-full gap-4 relative z-10">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-app-elevated flex items-center justify-center text-xl shrink-0 border border-app-border">
                        {getCategoryIcon(item.category)}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm text-app-text leading-tight tracking-tight truncate mb-1.5" title={item.name}>{item.name}</h4>
                        <div className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                            isExpired ? "text-app-danger border-app-danger/30 bg-app-danger/10" : isExpiringSoon ? "text-app-warning border-app-warning/30 bg-app-warning/10" : "text-app-success border-app-success/30 bg-app-success/10"
                        )}>
                            <Clock className="h-2.5 w-2.5" /> {daysRemaining < 0 ? 'Expired' : `${daysRemaining}d left`}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                    <div className="flex justify-between items-center border-t border-app-border pt-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-app-muted font-medium leading-none mb-1">Unit cost</span>
                            <span className="text-xs font-semibold text-app-text tabular-nums leading-none tracking-tight">{formatCurrency(item.costPerUnit)}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-app-muted font-medium leading-none mb-1 block">Category</span>
                            <p className="text-xs font-medium text-app-primary">{item.category}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <QuickStockControl item={item} onUpdate={onUpdate} className="flex-1 h-9 bg-app-elevated" />
                        {!isSelectionMode && (
                             <button
                                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                aria-label="Edit item"
                                className="h-9 w-9 rounded-full bg-app-elevated text-app-muted flex items-center justify-center hover:text-app-primary transition-all border border-app-border"
                            >
                                <Edit className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {isSelectionMode && (
                            <div className={cn(
                                "h-9 w-9 rounded-full flex items-center justify-center transition-colors border",
                                isSelected ? "bg-app-primary border-app-primary text-primary-foreground" : "bg-app-elevated border-app-border"
                            )}>
                               {isSelected && <CheckSquare className="h-3.5 w-3.5" />}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PantryItemCard;
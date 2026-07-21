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
                    "group relative flex items-center gap-4 p-3 bg-app-card border rounded-sm hover:border-app-primary/40 transition-all select-none shadow-sm overflow-hidden",
                    isSelected ? "border-app-primary bg-white/5" : "border-app-border",
                    isLowStock && "border-l-4 border-l-app-warning"
                )}
            >
                <div className="h-10 w-10 rounded-sm bg-app-bg flex items-center justify-center text-lg shadow-inner shrink-0 border border-white/5">
                    {getCategoryIcon(item.category)}
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-between gap-6">
                    <div className="min-w-0 flex-1">
                        <h4 className="font-black text-xs text-app-text truncate uppercase tracking-tight leading-none mb-1.5">{item.name}</h4>
                        <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black text-app-muted uppercase tracking-[0.2em]">{item.category}</span>
                            <span className="text-[8px] font-bold text-app-primary uppercase tabular-nums tracking-widest">{formatCurrency(item.costPerUnit)} / UNIT</span>
                        </div>
                    </div>

                    <div className="hidden sm:block shrink-0 px-4 border-x border-white/5">
                        <div className={cn(
                            "flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-sm border",
                            isExpired ? "text-red-500 border-red-500/30 bg-red-500/5" : isExpiringSoon ? "text-app-warning border-app-warning/30 bg-app-warning/5" : "text-app-success border-app-success/30 bg-app-success/5"
                        )}>
                            <Clock className="h-3 w-3" />
                            {daysRemaining < 0 ? 'PURGE_REQ' : `VERIFY_${daysRemaining}D`}
                        </div>
                    </div>

                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <QuickStockControl item={item} onUpdate={onUpdate} className="h-10 min-w-[100px]" />
                        {isSelectionMode && (
                             <div className={cn(
                                 "h-10 w-10 rounded-sm flex items-center justify-center transition-colors border",
                                 isSelected ? "bg-app-primary border-app-primary text-white" : "bg-transparent border-white/10"
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
                "group relative bg-app-card rounded-sm transition-all duration-200 border select-none overflow-hidden h-full flex flex-col shadow-md",
                isSelected ? "border-app-primary bg-white/5" : "border-app-border hover:border-app-primary/30",
                isLowStock && "border-t-2 border-t-app-warning"
            )}
        >
            <Shield className="absolute -bottom-4 -right-4 h-16 w-16 text-white/[0.02] pointer-events-none group-hover:scale-110 transition-transform" />
            
            <div className="p-4 flex flex-col h-full gap-4 relative z-10">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-sm bg-app-bg flex items-center justify-center text-xl shrink-0 border border-white/5 shadow-inner">
                        {getCategoryIcon(item.category)}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                        <h4 className="font-black text-[11px] text-app-text leading-tight uppercase tracking-tight truncate mb-1.5" title={item.name}>{item.name}</h4>
                        <div className={cn(
                            "inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm border bg-app-bg",
                            isExpired ? "text-red-500 border-red-500/30" : isExpiringSoon ? "text-app-warning border-app-warning/30" : "text-app-success border-app-success/30"
                        )}>
                            <Clock className="h-2.5 w-2.5" /> {daysRemaining < 0 ? 'EXPIRED' : `${daysRemaining}D VULN.`}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                    <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black text-app-muted uppercase tracking-[0.2em] leading-none mb-1">Fiscal_Val</span>
                            <span className="text-[10px] font-black text-app-text tabular-nums leading-none tracking-tight">{formatCurrency(item.costPerUnit)}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[7px] font-black text-app-muted uppercase tracking-[0.2em] leading-none mb-1">Sector</span>
                            <p className="text-[8px] font-black uppercase text-app-primary tracking-widest">{item.category.slice(0,3)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <QuickStockControl item={item} onUpdate={onUpdate} className="flex-1 h-8 bg-app-bg" />
                        {!isSelectionMode && (
                             <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                className="h-8 w-8 rounded-sm bg-app-bg text-app-muted flex items-center justify-center hover:text-app-primary transition-all border border-app-border"
                            >
                                <Edit className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {isSelectionMode && (
                            <div className={cn(
                                "h-8 w-8 rounded-sm flex items-center justify-center transition-colors border shadow-inner",
                                isSelected ? "bg-app-primary border-app-primary text-white" : "bg-app-bg border-white/10"
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
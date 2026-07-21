
import React from 'react';
import { Ingredient } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { CheckSquare } from 'lucide-react';
import { QuickStockControl } from './QuickStockControl';

// Helper functions duplicated or imported? 
// Since they are pure, better to keep them near where they are used or in utils.
// For now, I'll inline a simple version or expect them to be passed as props? 
// The original used helpers defined in the file. Let's redefine them here for isolation or move them to utils later.
// To keep it simple and robust, I'll redefine getDaysRemaining here locally or assume props passed down.
// But wait, the card needs to calculate expiry status.

const getDaysRemaining = (item: Ingredient) => {
    if (!item.last_verified) return 999;
    const lastVerified = new Date(item.last_verified);
    const expiryDate = new Date(lastVerified);
    expiryDate.setDate(expiryDate.getDate() + (item.shelf_life_days || 365));
    
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getExpiryStatus = (days: number) => {
    if (days < 0) return { label: 'Expired', color: 'text-app-danger bg-app-danger/15 border-app-danger/30' };
    if (days <= 3) return { label: 'Critical', color: 'text-app-danger bg-app-danger/15 border-app-danger/30' };
    if (days <= 7) return { label: 'Expiring', color: 'text-app-warning bg-app-warning/15 border-app-warning/30' };
    return { label: 'Good', color: 'text-app-success bg-app-success/15 border-app-success/30' };
};

const MobilePantryCard: React.FC<{
    item: Ingredient;
    onEdit: (item: Ingredient) => void;
    isSelected: boolean;
    isSelectionMode: boolean;
    onToggleSelect: (id: string) => void;
    onUpdate: (item: Ingredient) => void;
}> = React.memo(({ item, onEdit, isSelected, isSelectionMode, onToggleSelect, onUpdate }) => {
    const daysRemaining = getDaysRemaining(item);
    const expiryStatus = getExpiryStatus(daysRemaining);

    return (
        <div 
            onClick={() => isSelectionMode ? onToggleSelect(item.id) : onEdit(item)}
            className={cn(
                "bg-app-card border border-app-border p-3 rounded-lg flex items-center gap-3 transition-all active:scale-[0.98] shadow-soft",
                isSelected ? "border-app-primary bg-app-primary/10" : ""
            )}
        >
            {/* Selection Indicator for Mobile */}
            {isSelectionMode && (
                 <div className="shrink-0">
                    {isSelected ? (
                        <div className="h-5 w-5 bg-app-primary rounded-full text-primary-foreground flex items-center justify-center">
                            <CheckSquare className="h-3.5 w-3.5" />
                        </div>
                    ) : (
                        <div className="h-5 w-5 border-2 border-app-muted/30 rounded-full"></div>
                    )}
                </div>
            )}

            <div className={cn(
                "h-12 w-12 rounded-md flex items-center justify-center shrink-0 border text-xl relative overflow-hidden",
                item.packagesInStock <= 2
                    ? "bg-app-danger/15 border-app-danger/30 text-app-danger"
                    : "bg-app-elevated border-app-border"
            )}>
                 {/* Category Icon Mapping */}
                 {item.category === 'Dairy' && '🥛'}
                 {item.category === 'Vegetable' && '🥬'}
                 {item.category === 'Protein' && '🥩'}
                 {item.category === 'Spices' && '🌶️'}
                 {item.category === 'Grains' && '🌾'}
                 {item.category === 'Oils & Fats' && '🫒'}
                 {item.category === 'Condiments' && '🧂'}
                 {item.category === 'Fruit' && '🍎'}
                 {item.category === 'Baking' && '🥖'}
                 {item.category === 'Beverage' && '🥤'}
                 {['Dairy', 'Vegetable', 'Protein', 'Spices', 'Grains', 'Oils & Fats', 'Condiments', 'Fruit', 'Baking', 'Beverage'].indexOf(item.category) === -1 && '📦'}
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-sm text-app-text truncate pr-2">{item.name}</h4>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md border", expiryStatus.color)}>
                        {daysRemaining < 999 ? `${daysRemaining}d` : 'N/A'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                     <p className="text-[11px] text-app-muted flex items-center gap-1">
                        {item.quantityInStock.toLocaleString()} {item.baseUnit} &bull; {formatCurrency(item.costPerUnit)}/{item.baseUnit}
                     </p>
                     <div onClick={e => e.stopPropagation()}>
                        <QuickStockControl item={item} onUpdate={onUpdate} />
                     </div>
                </div>
            </div>
        </div>
    );
});

export default MobilePantryCard;

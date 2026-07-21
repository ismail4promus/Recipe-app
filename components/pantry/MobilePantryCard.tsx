
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
    if (days < 0) return { label: 'Expired', color: 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };
    if (days <= 3) return { label: 'Critical', color: 'text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' };
    if (days <= 7) return { label: 'Expiring', color: 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' };
    return { label: 'Good', color: 'text-green-600 bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' };
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
                "neu-card p-3 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98]",
                isSelected ? "border-primary bg-primary/5" : ""
            )}
        >
            {/* Selection Indicator for Mobile */}
            {isSelectionMode && (
                 <div className="shrink-0">
                    {isSelected ? (
                        <div className="h-5 w-5 bg-primary rounded text-primary-foreground flex items-center justify-center">
                            <CheckSquare className="h-3.5 w-3.5" />
                        </div>
                    ) : (
                        <div className="h-5 w-5 border-2 border-muted-foreground/30 rounded"></div>
                    )}
                </div>
            )}

            <div className={cn(
                "h-12 w-12 rounded-lg flex items-center justify-center shrink-0 border shadow-sm text-xl relative overflow-hidden",
                item.packagesInStock <= 2 
                    ? "bg-red-50 border-red-100 text-red-500 dark:bg-red-900/20 dark:border-red-800" 
                    : "bg-muted/30 border-border"
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
                    <h4 className="font-bold text-sm text-foreground truncate pr-2">{item.name}</h4>
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase", expiryStatus.color)}>
                        {daysRemaining < 999 ? `${daysRemaining}d` : 'N/A'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                     <p className="text-[10px] text-muted-foreground flex items-center gap-1">
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

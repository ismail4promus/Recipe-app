import React, { useMemo, useState, useEffect } from 'react';
import { RecipeIngredient, Ingredient } from '../../types';
import { cn, convertUnit, AVAILABLE_UNITS, formatCurrency } from '../../lib/utils';
import { Check, Edit, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getSuggestions = (name: string, pantry: Ingredient[]) => {
    const search = name.toLowerCase().replace(/\(.*\)/, '').trim();
    if (!search) return [];
    return pantry
        .filter(p => p.name.toLowerCase().includes(search) || search.includes(p.name.toLowerCase()))
        .slice(0, 2);
};

const formatIngredientName = (name: string) => {
    return name.replace(/\s\(([^)]+)\)/, ' || $1');
};

export const ViewIngredientRow: React.FC<{
    ing: RecipeIngredient;
    index: number;
    pantryItem?: Ingredient;
    scaleFactor: number;
    currentUnit: string;
    onUnitChange: (id: string, unit: string) => void;
    onEditPantryItem: (item: Ingredient) => void;
    onLinkIngredient: (ingId: string, pantryId: string) => void;
    onUpdateCost: (newCostPerUnit: number) => void;
    pantryIngredients: Ingredient[];
}> = React.memo(({ ing, index, pantryItem, scaleFactor, currentUnit, onUnitChange, onEditPantryItem, onLinkIngredient, onUpdateCost, pantryIngredients }) => {
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    
    // Quantity logic
    const requiredAmountBase = (ing.quantity || 0) * scaleFactor;
    // Safety check for unit
    const safeIngUnit = ing.unit || 'g';
    const safeCurrentUnit = currentUnit || 'g';
    
    const displayedAmount = convertUnit(requiredAmountBase, safeIngUnit, safeCurrentUnit);
    
    // Cost logic
    const conversionRatio = pantryItem ? convertUnit(1, safeIngUnit, pantryItem.baseUnit) : 1;
    const derivedUnitCost = pantryItem ? pantryItem.costPerUnit * conversionRatio : 0;
    const activeUnitCost = ing.manualCostPerUnit !== undefined ? ing.manualCostPerUnit : derivedUnitCost;
    const totalRowCost = activeUnitCost * requiredAmountBase;

    const [editPriceValue, setEditPriceValue] = useState(totalRowCost.toFixed(2));
    const isLowStock = pantryItem ? pantryItem.quantityInStock < requiredAmountBase : false;
    const suggestions = useMemo(() => !pantryItem ? getSuggestions(ing.name, pantryIngredients) : [], [pantryItem, ing.name, pantryIngredients]);

    useEffect(() => {
        setEditPriceValue(totalRowCost.toFixed(2));
    }, [totalRowCost]);

    const handlePriceSave = () => {
        const newTotal = parseFloat(editPriceValue);
        if (!isNaN(newTotal) && requiredAmountBase > 0) {
            const newUnitCost = newTotal / requiredAmountBase;
            onUpdateCost(newUnitCost);
        }
        setIsEditingPrice(false);
    };

    const isConverted = safeIngUnit !== safeCurrentUnit;

    return (
        <div className={cn(
            "p-3 md:p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group relative border-b border-border/40 last:border-0",
            isLowStock && "bg-red-50/50 dark:bg-red-900/5"
        )}>
            {/* Left: Ingredient Info */}
            <div className="flex items-start gap-3 flex-1">
                {/* Index / Checkbox */}
                <div className={cn(
                    "mt-0.5 h-6 w-6 rounded-md border flex items-center justify-center shrink-0 transition-all text-[10px] font-bold select-none",
                    isLowStock 
                        ? "border-red-200 bg-red-100 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400" 
                        : "border-border/60 bg-muted/20 text-muted-foreground"
                )}>
                    <span className="group-hover:hidden">{(index + 1)}</span>
                    <Check className="h-3.5 w-3.5 hidden group-hover:block text-primary" />
                </div>

                {/* Name & Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("font-bold text-foreground text-sm", isLowStock && "text-red-700 dark:text-red-400")}>
                            {formatIngredientName(ing.name)}
                        </span>
                        {ing.type && (
                            <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium uppercase tracking-wide border border-border/50">
                                {ing.type}
                            </span>
                        )}
                        {ing.notes && <span className="text-xs text-muted-foreground truncate max-w-[200px] border-l border-border pl-2">{ing.notes}</span>}
                    </div>
                    
                    {/* Tags Row */}
                    <div className="flex items-center gap-2 mt-1.5">
                        {isLowStock && (
                            <span className="text-[9px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Low Stock
                            </span>
                        )}
                         {ing.manualCostPerUnit !== undefined && (
                            <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Manual Price
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Center: Quantities & Conversion */}
            <div className="flex items-center gap-2 pl-9 md:pl-0">
                <div className="flex items-center bg-muted/40 rounded-lg p-1 border border-border/50">
                    {/* Original Quantity (if converted) */}
                    {isConverted && (
                        <div className="flex items-center px-2 py-1 gap-1 text-muted-foreground opacity-70">
                            <span className="font-medium text-xs">
                                {requiredAmountBase.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-bold uppercase">{safeIngUnit}</span>
                            <ArrowRight className="h-3 w-3 mx-1" />
                        </div>
                    )}

                    {/* Active/Converted Quantity */}
                    <div className="flex items-center bg-background rounded-md px-2 py-1 shadow-sm border border-border/50">
                        <span className="font-bold text-sm text-primary tabular-nums mr-1.5">
                            {displayedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                        <div className="relative">
                            <select 
                                value={safeCurrentUnit}
                                onChange={(e) => onUnitChange(ing.id, e.target.value)}
                                className="appearance-none bg-transparent text-[10px] font-black uppercase text-foreground pr-3 focus:outline-none cursor-pointer hover:text-primary transition-colors text-right"
                            >
                                {AVAILABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-[8px]">▼</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Pantry & Cost Actions */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pl-9 md:pl-0 min-w-[80px]">
                {/* Price Display */}
                {isEditingPrice ? (
                     <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                        <input 
                            type="number" 
                            value={editPriceValue}
                            onChange={(e) => setEditPriceValue(e.target.value)}
                            className="w-16 h-7 text-xs px-1 border border-primary rounded bg-background"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handlePriceSave()}
                        />
                        <button onClick={handlePriceSave} className="bg-primary text-primary-foreground p-1 rounded hover:bg-primary/90">
                            <Check className="h-3.5 w-3.5" />
                        </button>
                     </div>
                ) : (
                    <div 
                        className="flex items-center gap-1.5 cursor-pointer group/price"
                        onClick={() => setIsEditingPrice(true)}
                        title="Click to edit total cost"
                    >
                        <span className="text-xs font-bold text-muted-foreground/80 group-hover/price:text-foreground transition-colors font-mono">
                            {formatCurrency(totalRowCost)}
                        </span>
                         <Edit className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/price:opacity-100 transition-opacity" />
                    </div>
                )}

                {/* Linking / Stock Status */}
                {pantryItem ? (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-full border border-border/30">
                        <span className={cn("font-medium", isLowStock ? "text-red-600 font-bold" : "")}>
                            {pantryItem.packagesInStock} {pantryItem.packageUnit}
                        </span>
                         <button 
                            onClick={(e) => { e.stopPropagation(); onEditPantryItem(pantryItem); }}
                            className="hover:text-primary transition-colors border-l border-border/50 pl-1 ml-1"
                        >
                            <Edit className="h-2.5 w-2.5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-end gap-1">
                         {suggestions.length > 0 ? (
                            <div className="flex gap-1">
                                {suggestions.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => onLinkIngredient(ing.id, s.id)}
                                        className="text-[9px] flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors font-bold border border-primary/20"
                                    >
                                        <LinkIcon className="h-2 w-2" /> {s.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                             <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                 Unlinked
                             </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});
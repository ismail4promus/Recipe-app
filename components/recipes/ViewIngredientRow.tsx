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

    const priceEl = isEditingPrice ? (
        <div className="flex items-center gap-1">
            <input
                type="number"
                aria-label="Total cost"
                value={editPriceValue}
                onChange={(e) => setEditPriceValue(e.target.value)}
                className="w-16 h-8 text-xs px-2 border border-app-primary rounded-md bg-app-elevated text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handlePriceSave()}
                onClick={(e) => e.stopPropagation()}
            />
            <button aria-label="Save cost" onClick={(e) => { e.stopPropagation(); handlePriceSave(); }} className="bg-app-primary text-primary-foreground p-1.5 rounded-md hover:brightness-105">
                <Check className="h-3.5 w-3.5" />
            </button>
        </div>
    ) : (
        <button
            className="flex items-center gap-1 cursor-pointer group/price focus:outline-none"
            onClick={(e) => { e.stopPropagation(); setIsEditingPrice(true); }}
            title="Click to edit total cost"
        >
            <span className="text-sm font-semibold text-app-text tabular-nums">{formatCurrency(totalRowCost)}</span>
            <Edit className="h-3 w-3 text-app-muted opacity-0 group-hover/price:opacity-100 transition-opacity" />
        </button>
    );

    return (
        <div className={cn(
            "p-2.5 md:p-3 hover:bg-app-muted/10 transition-colors flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3 group relative border-b border-app-border last:border-0",
            isLowStock && "bg-app-danger/5"
        )}>
            {/* Info + cost (line 1 on mobile) */}
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className={cn(
                    "mt-px h-6 w-6 rounded-md border flex items-center justify-center shrink-0 text-xs font-semibold select-none",
                    isLowStock ? "border-app-danger/40 bg-app-danger/10 text-app-danger" : "border-app-border bg-app-muted/10 text-app-muted"
                )}>
                    <span className="group-hover:hidden">{index + 1}</span>
                    <Check className="h-3.5 w-3.5 hidden group-hover:block text-app-primary" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className={cn("font-semibold text-app-text text-sm", isLowStock && "text-app-danger")}>
                                {formatIngredientName(ing.name)}
                            </span>
                            {ing.type && (
                                <span className="text-[11px] bg-app-elevated px-1.5 py-0.5 rounded-sm text-app-muted font-medium border border-app-border">{ing.type}</span>
                            )}
                        </div>
                        {/* cost — shown inline on mobile, moves to right column on desktop */}
                        <div className="shrink-0 md:hidden">{priceEl}</div>
                    </div>

                    {(ing.notes || isLowStock || ing.manualCostPerUnit !== undefined) && (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {isLowStock && <span className="text-[11px] font-medium bg-app-danger/10 text-app-danger px-1.5 py-0.5 rounded-sm">Low Stock</span>}
                            {ing.manualCostPerUnit !== undefined && <span className="text-[11px] font-medium bg-app-info/10 text-app-info px-1.5 py-0.5 rounded-sm">Manual Price</span>}
                            {ing.notes && <span className="text-[11px] text-app-muted truncate max-w-[220px]">{ing.notes}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Quantity + stock — one row (line 2) on mobile; dissolves into the desktop row */}
            <div className="flex items-center justify-between gap-2 pl-[34px] md:pl-0 md:contents">
                {/* Quantity */}
                <div className="flex items-center bg-app-muted/10 rounded-md p-0.5 border border-app-border">
                    {isConverted && (
                        <div className="flex items-center px-2 py-1 gap-1 text-app-muted opacity-70">
                            <span className="font-medium text-xs">{requiredAmountBase.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            <span className="text-xs font-medium">{safeIngUnit}</span>
                            <ArrowRight className="h-3 w-3 mx-0.5" />
                        </div>
                    )}
                    <div className="flex items-center bg-app-card rounded-sm px-2.5 py-1 shadow-soft border border-app-border">
                        <span className="font-semibold text-sm text-app-primary tabular-nums mr-1.5">{displayedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        <div className="relative">
                            <select
                                value={safeCurrentUnit}
                                aria-label="Display unit"
                                onChange={(e) => onUnitChange(ing.id, e.target.value)}
                                className="appearance-none bg-transparent text-xs font-semibold text-app-text pr-3 focus:outline-none cursor-pointer hover:text-app-primary transition-colors text-right"
                            >
                                {AVAILABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-app-muted text-[8px]">▼</span>
                        </div>
                    </div>
                </div>

                {/* Right: cost (desktop) + stock/link */}
                <div className="flex items-center gap-2 md:flex-col md:items-end md:gap-1 md:min-w-[84px]">
                    <div className="hidden md:block">{priceEl}</div>

                    {pantryItem ? (
                        <div className="flex items-center gap-1 text-[11px] text-app-muted bg-app-muted/10 px-1.5 py-0.5 rounded-sm border border-app-border">
                            <span className={cn("font-medium", isLowStock && "text-app-danger font-semibold")}>{pantryItem.packagesInStock} {pantryItem.packageUnit}</span>
                            <button aria-label="Edit inventory" onClick={(e) => { e.stopPropagation(); onEditPantryItem(pantryItem); }} className="hover:text-app-primary transition-colors border-l border-app-border pl-1 ml-0.5">
                                <Edit className="h-2.5 w-2.5" />
                            </button>
                        </div>
                    ) : suggestions.length > 0 ? (
                        <div className="flex gap-1">
                            {suggestions.map(s => (
                                <button key={s.id} onClick={(e) => { e.stopPropagation(); onLinkIngredient(ing.id, s.id); }} className="text-[11px] flex items-center gap-1 bg-app-primary/10 text-app-primary px-1.5 py-0.5 rounded-sm hover:bg-app-primary/20 transition-colors font-medium border border-app-primary/20">
                                    <LinkIcon className="h-2.5 w-2.5" /> {s.name}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span className="text-[11px] text-app-warning font-medium bg-app-warning/10 px-1.5 py-0.5 rounded-sm border border-app-warning/20">Unlinked</span>
                    )}
                </div>
            </div>
        </div>
    );
});
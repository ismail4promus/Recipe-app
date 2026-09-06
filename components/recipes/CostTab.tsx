import React, { useMemo } from 'react';
import { Recipe, Ingredient } from '../../types';
import { AlertTriangle, Package, Calculator, TrendingUp, DollarSign, ShieldCheck } from 'lucide-react';
import { formatCurrency, baseUnitRatio } from '../../lib/utils';

export const CostTab: React.FC<{ 
    recipe: Recipe; 
    scaleFactor: number; 
    pantryIngredients: Ingredient[];
}> = ({ recipe, scaleFactor, pantryIngredients }) => {
    
    const { totalCost, unlinkedCount, unconvertibleCount } = useMemo(() => {
        let cost = 0;
        let unlinked = 0;
        let unconvertible = 0;
        const allIngredients = recipe.ingredientSections?.flatMap(s => s.ingredients || []) || [];

        allIngredients.forEach(ing => {
            const qty = (ing.quantity || 0) * scaleFactor;

            if (ing.manualCostPerUnit !== undefined) {
                cost += qty * ing.manualCostPerUnit;
                return;
            }

            const pantryItem = pantryIngredients.find(pi => pi.id === ing.ingredientId);
            if (!pantryItem || !pantryItem.costPerUnit) {
                unlinked++;
                return;
            }

            const ratio = baseUnitRatio(ing, pantryItem.baseUnit, pantryItem.unitConversions);
            if (ratio === null) {
                // e.g. recipe says "2 pc" and the pantry stocks grams — guessing here
                // would quietly produce a wrong price, so leave it out and say so.
                unconvertible++;
                return;
            }
            cost += qty * ratio * pantryItem.costPerUnit;
        });
        return { totalCost: cost, unlinkedCount: unlinked, unconvertibleCount: unconvertible };
    }, [recipe, scaleFactor, pantryIngredients]);

    const costPerServing = recipe.servings ? totalCost / (recipe.servings * scaleFactor) : 0;
    const overheadCost = totalCost * (recipe.overheadPercentage / 100);
    const profitAmount = totalCost * (recipe.profitMargin / 100);
    const suggestedPrice = totalCost + overheadCost + profitAmount;

    return (
        <div className="space-y-2">
            {unlinkedCount > 0 && (
                 <div className="bg-app-warning/10 border border-app-warning/20 p-2.5 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-app-warning shrink-0 mt-px" />
                    <p className="text-xs text-app-text font-medium leading-relaxed">
                        {unlinkedCount} ingredients are missing pricing. Link them for an accurate cost.
                    </p>
                </div>
            )}

            {unconvertibleCount > 0 && (
                 <div className="bg-app-warning/10 border border-app-warning/20 p-2.5 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-app-warning shrink-0 mt-px" />
                    <p className="text-xs text-app-text font-medium leading-relaxed">
                        {unconvertibleCount} ingredient{unconvertibleCount > 1 ? 's use units' : ' uses a unit'} that cannot be converted to the stocked unit, so {unconvertibleCount > 1 ? 'they are' : 'it is'} excluded from this total. Set the conversion when editing the recipe.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-app-elevated rounded-xl border border-app-border p-2.5 shadow-soft">
                    <p className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" /> Ingredient cost
                    </p>
                    <p className="text-2xl font-bold text-app-text tabular-nums leading-none tracking-tight">{formatCurrency(totalCost)}</p>
                    <p className="mt-1.5 pt-1.5 border-t border-app-border text-xs font-medium text-app-primary">
                        {formatCurrency(costPerServing)} per serving
                    </p>
                </div>

                <div className="bg-app-elevated rounded-xl border border-app-border p-2.5 shadow-soft">
                    <p className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Calculator className="h-3.5 w-3.5" /> Profit
                    </p>
                    <p className="text-2xl font-bold text-app-success tabular-nums leading-none tracking-tight">{formatCurrency(profitAmount)}</p>
                    <p className="mt-1.5 pt-1.5 border-t border-app-border text-xs font-medium text-app-muted">
                        {recipe.profitMargin}% margin
                    </p>
                </div>

                <div className="bg-app-primary rounded-xl border border-app-primary p-2.5 shadow-soft relative overflow-hidden">
                    <DollarSign className="absolute -bottom-3 -right-3 h-16 w-16 text-primary-foreground/10" />
                    <p className="text-[11px] font-semibold text-primary-foreground/80 uppercase tracking-wider mb-1.5">Suggested price</p>
                    <p className="text-2xl font-bold text-primary-foreground tabular-nums leading-none tracking-tight">{formatCurrency(suggestedPrice)}</p>
                    <p className="mt-1.5 pt-1.5 border-t border-primary-foreground/20 text-xs font-medium text-primary-foreground/90">
                        {formatCurrency(suggestedPrice / (recipe.servings * scaleFactor))} per serving
                    </p>
                </div>
            </div>

            <div className="bg-app-elevated rounded-xl border border-app-border shadow-soft">
                <div className="px-2.5 py-1.5 border-b border-app-border font-semibold text-[11px] uppercase tracking-wider text-app-muted flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5 text-app-primary" /> Cost breakdown
                </div>
                <div className="divide-y divide-app-border">
                    <div className="flex justify-between px-2.5 py-1.5 text-xs">
                        <span className="font-medium text-app-muted">Ingredients</span>
                        <span className="font-semibold text-app-text tabular-nums">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between px-2.5 py-1.5 text-xs">
                        <span className="font-medium text-app-muted">Overhead ({recipe.overheadPercentage}%)</span>
                        <span className="font-semibold text-app-text tabular-nums">{formatCurrency(overheadCost)}</span>
                    </div>
                    <div className="flex justify-between items-baseline px-2.5 py-2 bg-app-muted/10">
                        <span className="text-xs font-semibold text-app-text">Total cost</span>
                        <span className="text-base font-bold text-app-primary tabular-nums">{formatCurrency(totalCost + overheadCost)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
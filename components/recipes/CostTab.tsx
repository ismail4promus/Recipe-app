import React, { useMemo } from 'react';
import { Recipe, Ingredient } from '../../types';
import { AlertTriangle, Package, Calculator, TrendingUp, DollarSign, ShieldCheck } from 'lucide-react';
import { formatCurrency, convertUnit } from '../../lib/utils';

export const CostTab: React.FC<{ 
    recipe: Recipe; 
    scaleFactor: number; 
    pantryIngredients: Ingredient[];
}> = ({ recipe, scaleFactor, pantryIngredients }) => {
    
    const { totalCost, unlinkedCount } = useMemo(() => {
        let cost = 0;
        let unlinked = 0;
        const allIngredients = recipe.ingredientSections?.flatMap(s => s.ingredients || []) || [];
        
        allIngredients.forEach(ing => {
            const qty = ing.quantity * scaleFactor;
            
            if (ing.manualCostPerUnit !== undefined) {
                cost += qty * ing.manualCostPerUnit;
            } else {
                const pantryItem = pantryIngredients.find(pi => pi.id === ing.ingredientId);
                if (pantryItem && pantryItem.costPerUnit) {
                    const ratio = convertUnit(1, ing.unit, pantryItem.baseUnit);
                    cost += qty * ratio * pantryItem.costPerUnit;
                } else {
                    unlinked++;
                }
            }
        });
        return { totalCost: cost, unlinkedCount: unlinked };
    }, [recipe, scaleFactor, pantryIngredients]);

    const costPerServing = recipe.servings ? totalCost / (recipe.servings * scaleFactor) : 0;
    const overheadCost = totalCost * (recipe.overheadPercentage / 100);
    const profitAmount = totalCost * (recipe.profitMargin / 100);
    const suggestedPrice = totalCost + overheadCost + profitAmount;

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {unlinkedCount > 0 && (
                 <div className="bg-app-warning/10 border border-app-warning/20 rounded-lg p-5 flex items-center gap-4">
                    <AlertTriangle className="h-6 w-6 text-app-warning shrink-0" />
                    <p className="text-sm text-app-text font-medium">
                        {unlinkedCount} ingredients are missing pricing. Link them for an accurate cost.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-app-elevated border border-app-border p-6 md:p-5 rounded-lg relative overflow-hidden group shadow-soft">
                    <p className="text-sm font-medium text-app-muted mb-4 flex items-center gap-2">
                        <Package className="h-4 w-4" /> Ingredient Cost
                    </p>
                    <p className="text-4xl font-bold text-app-text tabular-nums leading-none tracking-tight">{formatCurrency(totalCost)}</p>
                    <div className="mt-4 pt-4 border-t border-app-border">
                        <p className="text-sm font-medium text-app-primary">{formatCurrency(costPerServing)} per serving</p>
                    </div>
                </div>

                <div className="bg-app-elevated border border-app-border p-6 md:p-5 rounded-lg relative overflow-hidden group shadow-soft">
                    <p className="text-sm font-medium text-app-muted mb-4 flex items-center gap-2">
                        <Calculator className="h-4 w-4" /> Profit
                    </p>
                    <p className="text-4xl font-bold text-app-success tabular-nums leading-none tracking-tight">{formatCurrency(profitAmount)}</p>
                    <div className="mt-4 pt-4 border-t border-app-border">
                        <p className="text-sm font-medium text-app-muted">{recipe.profitMargin}% margin</p>
                    </div>
                </div>

                <div className="bg-app-primary p-6 md:p-5 rounded-lg relative overflow-hidden group shadow-soft border border-app-primary">
                    <DollarSign className="absolute -bottom-4 -right-4 h-24 w-24 text-white/[0.1]" />
                    <p className="text-sm font-medium text-white/80 mb-4">Suggested Price</p>
                    <p className="text-4xl font-bold text-white tabular-nums leading-none tracking-tight">{formatCurrency(suggestedPrice)}</p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-sm font-medium text-white/90">{formatCurrency(suggestedPrice / (recipe.servings * scaleFactor))} per serving</p>
                    </div>
                </div>
            </div>

            <div className="bg-app-elevated rounded-lg border border-app-border shadow-soft overflow-hidden">
                <div className="p-5 border-b border-app-border font-semibold text-sm text-app-text flex items-center gap-3">
                    <Calculator className="h-4 w-4 text-app-primary" /> Cost Breakdown
                </div>
                <div className="divide-y divide-app-border">
                    <div className="flex justify-between p-5 text-sm">
                        <span className="text-sm font-medium text-app-muted">Ingredients</span>
                        <span className="font-semibold text-app-text tabular-nums">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between p-5 text-sm">
                        <span className="text-sm font-medium text-app-muted">Overhead ({recipe.overheadPercentage}%)</span>
                        <span className="font-semibold text-app-text tabular-nums">{formatCurrency(overheadCost)}</span>
                    </div>
                    <div className="flex justify-between p-6 bg-app-muted/10 border-t border-app-border">
                        <span className="text-sm font-semibold text-app-text">Total Cost</span>
                        <span className="text-xl font-bold text-app-primary tabular-nums">{formatCurrency(totalCost + overheadCost)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
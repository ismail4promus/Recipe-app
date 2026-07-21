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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {unlinkedCount > 0 && (
                 <div className="bg-app-warning/10 border border-app-warning/20 rounded-sm p-5 flex items-center gap-4">
                    <AlertTriangle className="h-6 w-6 text-app-warning shrink-0" />
                    <p className="text-[10px] text-app-text font-black uppercase tracking-[0.15em]">
                        AUDIT INCOMPLETE: {unlinkedCount} Assets missing fiscal markers. verify ingredient links for valid yield.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-app-bg border border-app-border p-8 rounded-sm relative overflow-hidden group shadow-lg">
                    <TrendingUp className="absolute -bottom-4 -right-4 h-24 w-24 text-white/[0.02]" />
                    <p className="text-[10px] font-black uppercase text-app-muted tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Package className="h-3 w-3" /> Raw COGS
                    </p>
                    <p className="text-4xl font-black text-app-text tabular-nums leading-none tracking-tighter">{formatCurrency(totalCost)}</p>
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] font-bold text-app-primary uppercase tracking-widest">{formatCurrency(costPerServing)} / UNIT YIELD</p>
                    </div>
                </div>

                <div className="bg-app-bg border border-app-border p-8 rounded-sm relative overflow-hidden group shadow-lg">
                    <ShieldCheck className="absolute -bottom-4 -right-4 h-24 w-24 text-app-success/[0.03]" />
                    <p className="text-[10px] font-black uppercase text-app-muted tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Calculator className="h-3 w-3" /> Target Net
                    </p>
                    <p className="text-4xl font-black text-app-success tabular-nums leading-none tracking-tighter">{formatCurrency(profitAmount)}</p>
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">{recipe.profitMargin}% PROFIT THRESHOLD</p>
                    </div>
                </div>

                <div className="bg-app-primary p-8 rounded-sm relative overflow-hidden group shadow-2xl border border-app-primary">
                    <DollarSign className="absolute -bottom-4 -right-4 h-24 w-24 text-white/[0.1]" />
                    <p className="text-[10px] font-black uppercase text-white/70 tracking-[0.3em] mb-4">Mkt Valve Price</p>
                    <p className="text-4xl font-black text-white tabular-nums leading-none tracking-tighter">{formatCurrency(suggestedPrice)}</p>
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/90">{formatCurrency(suggestedPrice / (recipe.servings * scaleFactor))} / SRP</p>
                    </div>
                </div>
            </div>

            <div className="bg-app-bg rounded-sm border border-app-border shadow-xl overflow-hidden">
                <div className="p-5 border-b border-app-border bg-white/[0.02] font-black text-[11px] uppercase tracking-[0.4em] text-app-muted flex items-center gap-3">
                    <Calculator className="h-4 w-4 text-app-primary" /> Fiscal Ledger Breakdown
                </div>
                <div className="divide-y divide-white/5">
                    <div className="flex justify-between p-5 text-sm hover:bg-white/[0.01] transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-app-muted">Asset Base</span>
                        <span className="font-black text-app-text tabular-nums">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between p-5 text-sm hover:bg-white/[0.01] transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-app-muted">Logistics & Overhead ({recipe.overheadPercentage}%)</span>
                        <span className="font-black text-app-text tabular-nums">{formatCurrency(overheadCost)}</span>
                    </div>
                    <div className="flex justify-between p-6 bg-white/[0.03] border-t border-app-border">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-app-text">Total Operational Cost</span>
                        <span className="text-xl font-black text-app-primary tabular-nums">{formatCurrency(totalCost + overheadCost)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
import React, { useState, useMemo, useCallback } from 'react';
import { Recipe, Ingredient, RecipeIngredient } from '../../types';
import { AlertTriangle, Scale, CookingPot, ClipboardCheck, Boxes, Link as LinkIcon, PackagePlus, ArrowRight } from 'lucide-react';
import { ViewIngredientRow } from './ViewIngredientRow';
import { QuickEditIngredientModal } from './QuickEditIngredientModal';
import { AnimatePresence, motion } from 'framer-motion';
import { cn, normalizeUnit } from '../../lib/utils';
import { proposeLinks, pantryItemFromRecipeIngredient } from '../../lib/pantryMatch';
import { useData } from '../../context/DataContext';
import { useConfirm } from '../../context/ConfirmContext';

export const IngredientsTab: React.FC<{ 
    recipe: Recipe; 
    scaleFactor: number;
    pantryIngredients: Ingredient[];
    onUpdatePantryItem: (item: Ingredient) => void;
    onUpdateRecipe: (recipe: Recipe) => void;
}> = ({ recipe, scaleFactor, pantryIngredients = [], onUpdatePantryItem, onUpdateRecipe }) => {
    const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
    const [displayUnits, setDisplayUnits] = useState<Record<string, string>>({});
    const [activeSystem, setActiveSystem] = useState<'original' | 'metric' | 'imperial'>('original');

    const { batchAddIngredients } = useData();
    const confirm = useConfirm();
    const [busy, setBusy] = useState(false);

    // Every unlinked line, with the inventory item it most likely means.
    const proposals = useMemo(
        () => proposeLinks(recipe.ingredientSections || [], pantryIngredients),
        [recipe.ingredientSections, pantryIngredients]
    );
    const unlinkedCount = proposals.length;
    const linkable = useMemo(() => proposals.filter(p => p.match), [proposals]);
    const missing = useMemo(() => proposals.filter(p => !p.match), [proposals]);

    /** Apply a set of recipe-ingredient id -> pantry id links in one write. */
    const applyLinks = useCallback((links: Map<string, string>) => {
        if (links.size === 0) return;
        const newSections = recipe.ingredientSections.map(sec => ({
            ...sec,
            ingredients: sec.ingredients.map(i =>
                links.has(i.id) ? { ...i, ingredientId: links.get(i.id)! } : i
            ),
        }));
        onUpdateRecipe({ ...recipe, ingredientSections: newSections });
    }, [recipe, onUpdateRecipe]);

    const handleAutoLink = useCallback(() => {
        const links = new Map(linkable.map(p => [p.ingredient.id, p.match!.item.id]));
        applyLinks(links);
    }, [linkable, applyLinks]);

    /**
     * Create inventory records for lines that match nothing, then link to them.
     * Stock and cost start at zero, so the recipe still shows no price until
     * someone enters real numbers — but it is no longer silently excluded.
     */
    const handleCreateMissing = useCallback(async () => {
        if (missing.length === 0) return;
        const ok = await confirm({
            title: `Create ${missing.length} inventory item${missing.length === 1 ? '' : 's'}?`,
            message: 'They start at zero stock and zero cost, then get linked to this recipe.',
            details: missing.slice(0, 6).map(p => p.ingredient.name)
                .concat(missing.length > 6 ? [`…and ${missing.length - 6} more`] : [])
                .concat(['Set package size and price afterwards in Inventory.']),
            confirmLabel: 'Create and link',
        });
        if (!ok) return;

        setBusy(true);
        try {
            const stamp = Date.now();
            const created = missing.map((p, i) => pantryItemFromRecipeIngredient(p.ingredient, i, stamp));
            const saved = await batchAddIngredients(created);
            if (!saved) return;   // the save banner already explains why
            applyLinks(new Map(missing.map((p, i) => [p.ingredient.id, created[i].id])));
        } finally {
            setBusy(false);
        }
    }, [missing, batchAddIngredients, applyLinks, confirm]);

    const handleLinkIngredient = useCallback((sectionId: string, ingredientId: string, pantryId: string) => {
        const newSections = recipe.ingredientSections.map(sec => {
            if (sec.id !== sectionId) return sec;
            return {
                ...sec,
                ingredients: sec.ingredients.map(i => 
                    i.id === ingredientId ? { ...i, ingredientId: pantryId } : i
                )
            };
        });
        onUpdateRecipe({ ...recipe, ingredientSections: newSections });
    }, [recipe, onUpdateRecipe]);

    const handleUnitChange = useCallback((id: string, unit: string) => {
        setDisplayUnits(prev => ({...prev, [id]: unit}));
    }, []);

    /** "1 pc = 150 g" belongs to the ingredient, not to one recipe line. */
    const handleSetUnitConversion = useCallback((item: Ingredient, unit: string, perUnit: number) => {
        const canonical = normalizeUnit(unit) ?? unit;
        onUpdatePantryItem({
            ...item,
            unitConversions: { ...(item.unitConversions || {}), [canonical]: perUnit },
        });
    }, [onUpdatePantryItem]);

    const handleUpdateIngredientCost = useCallback((sectionId: string, ingredientId: string, newCostPerUnit: number) => {
         const newSections = recipe.ingredientSections.map(sec => {
            if (sec.id !== sectionId) return sec;
            return {
                ...sec,
                ingredients: sec.ingredients.map(i => 
                    i.id === ingredientId ? { ...i, manualCostPerUnit: newCostPerUnit } : i
                )
            };
        });
        onUpdateRecipe({ ...recipe, ingredientSections: newSections });
    }, [recipe, onUpdateRecipe]);

    const handleBatchConvert = (system: 'original' | 'metric' | 'imperial') => {
        setActiveSystem(system);
        if (system === 'original') {
            setDisplayUnits({});
            return;
        }

        const newUnits: Record<string, string> = { ...displayUnits };
        recipe.ingredientSections.forEach(sec => {
            sec.ingredients.forEach(ing => {
                let targetUnit = ing.unit;
                if (system === 'metric') {
                    if (['oz', 'lb'].includes(ing.unit)) targetUnit = 'g';
                    if (['cup', 'tbsp', 'tsp', 'gallon'].includes(ing.unit)) targetUnit = 'ml';
                } else {
                    if (['g', 'kg'].includes(ing.unit)) targetUnit = 'oz';
                    if (['ml', 'l'].includes(ing.unit)) targetUnit = 'cup';
                }
                newUnits[ing.id] = targetUnit;
            });
        });
        setDisplayUnits(newUnits);
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center gap-2 bg-app-elevated rounded-xl border border-app-border p-1.5 shadow-soft">
                <span className="flex items-center gap-1.5 pl-1 text-xs font-medium text-app-muted">
                    <Boxes className="h-3.5 w-3.5 text-app-primary" />
                    {recipe.ingredientSections.length} sections
                </span>
                <div className="flex bg-app-card rounded-xl border border-app-border">
                    {(['original', 'metric', 'imperial'] as const).map((sys) => (
                        <button
                            key={sys}
                            onClick={() => handleBatchConvert(sys)}
                            className={cn(
                                "px-3 py-1 text-xs font-semibold capitalize transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60",
                                activeSystem === sys
                                    ? "text-primary-foreground bg-app-primary"
                                    : "text-app-muted hover:text-app-text"
                            )}
                        >
                            {sys}
                        </button>
                    ))}
                </div>
            </div>

            {unlinkedCount > 0 && (
                <div className="bg-app-warning/10 border border-app-warning/20 p-2.5 space-y-2">
                    <div className="flex gap-2.5 items-start">
                        <AlertTriangle className="h-4 w-4 text-app-warning shrink-0 mt-px" />
                        <p className="text-xs text-app-text font-medium leading-relaxed">
                            {unlinkedCount} ingredient{unlinkedCount === 1 ? '' : 's'} {unlinkedCount === 1 ? 'is' : 'are'} not linked to inventory, so {unlinkedCount === 1 ? 'it is' : 'they are'} left out of the cost.
                            {linkable.length > 0 && ` ${linkable.length} match an inventory item by name.`}
                            {missing.length > 0 && ` ${missing.length} ${missing.length === 1 ? 'has' : 'have'} nothing to match.`}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pl-6">
                        {linkable.length > 0 && (
                            <button
                                type="button"
                                onClick={handleAutoLink}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 rounded-full border border-app-primary bg-app-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground transition-all hover:brightness-105 disabled:opacity-50"
                            >
                                <LinkIcon className="h-3 w-3" /> Link {linkable.length} by name
                            </button>
                        )}
                        {missing.length > 0 && (
                            <button
                                type="button"
                                onClick={handleCreateMissing}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-app-border bg-app-card px-2.5 py-1 text-[11px] font-semibold text-app-text transition-colors hover:border-app-primary/50 disabled:opacity-50"
                            >
                                <PackagePlus className="h-3 w-3" /> Add {missing.length} to inventory
                            </button>
                        )}
                    </div>

                    {linkable.length > 0 && (
                        <ul className="pl-6 space-y-0.5">
                            {linkable.slice(0, 4).map(p => (
                                <li key={p.ingredient.id} className="text-[11px] text-app-muted flex items-center gap-1.5">
                                    <span className="truncate max-w-[45%]">{p.ingredient.name}</span>
                                    <ArrowRight className="h-3 w-3 shrink-0" />
                                    <span className="truncate max-w-[45%] text-app-text">{p.match!.item.name}</span>
                                    {p.match!.confidence === 'close' && <span className="text-app-warning">(close match)</span>}
                                </li>
                            ))}
                            {linkable.length > 4 && (
                                <li className="text-[11px] text-app-muted">…and {linkable.length - 4} more</li>
                            )}
                        </ul>
                    )}
                </div>
            )}

            <div className="space-y-2">
                {recipe.ingredientSections?.map((section, idx) => (
                    <div key={section.id} className="relative">
                        <div className="flex items-center gap-2 mb-1 px-0.5">
                            <h3 className="font-semibold text-xs uppercase tracking-wider text-app-muted">{section.name}</h3>
                            <div className="h-px flex-1 bg-app-border"></div>
                        </div>

                        <div className="bg-app-elevated rounded-xl border border-app-border overflow-hidden divide-y divide-app-border">
                            {section.ingredients?.map((ing, index) => {
                                // Fix: Change 'ri' to 'ing' as 'ri' is not defined in this scope
                                const pantryItem = pantryIngredients.find(pi => pi.id === ing.ingredientId);
                                return (
                                    <ViewIngredientRow
                                        key={ing.id}
                                        index={index}
                                        ing={ing}
                                        pantryItem={pantryItem}
                                        scaleFactor={scaleFactor}
                                        currentUnit={displayUnits[ing.id] || ing.unit}
                                        onUnitChange={handleUnitChange}
                                        onEditPantryItem={setEditingItem}
                                        onLinkIngredient={(ingId, pantryId) => handleLinkIngredient(section.id, ingId, pantryId)}
                                        onUpdateCost={(cost) => handleUpdateIngredientCost(section.id, ing.id, cost)}
                                        onSetUnitConversion={handleSetUnitConversion}
                                        pantryIngredients={pantryIngredients}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            
            <AnimatePresence>
                {editingItem && (
                    <QuickEditIngredientModal 
                        ingredient={editingItem} 
                        onClose={() => setEditingItem(null)} 
                        onSave={onUpdatePantryItem} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
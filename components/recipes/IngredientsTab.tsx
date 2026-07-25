import React, { useState, useMemo, useCallback } from 'react';
import { Recipe, Ingredient, RecipeIngredient } from '../../types';
import { AlertTriangle, Scale, CookingPot, ClipboardCheck, Boxes } from 'lucide-react';
import { ViewIngredientRow } from './ViewIngredientRow';
import { QuickEditIngredientModal } from './QuickEditIngredientModal';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

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

    const unlinkedCount = useMemo(() => {
        const allIngredients = recipe.ingredientSections?.flatMap(s => s.ingredients || []) || [];
        return allIngredients.filter(ri => !pantryIngredients.find(pi => pi.id === ri.ingredientId)).length;
    }, [recipe, pantryIngredients]);

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
            <div className="flex justify-between items-center gap-2 bg-app-elevated border border-app-border p-1.5 shadow-soft">
                <span className="flex items-center gap-1.5 pl-1 text-xs font-medium text-app-muted">
                    <Boxes className="h-3.5 w-3.5 text-app-primary" />
                    {recipe.ingredientSections.length} sections
                </span>
                <div className="flex bg-app-card border border-app-border">
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
                <div className="bg-app-warning/10 border border-app-warning/20 p-2.5 flex gap-2.5 items-center">
                    <AlertTriangle className="h-4 w-4 text-app-warning shrink-0" />
                    <p className="text-xs text-app-text font-medium">
                        {unlinkedCount} ingredients need linking for accurate costing.
                    </p>
                </div>
            )}

            <div className="space-y-2">
                {recipe.ingredientSections?.map((section, idx) => (
                    <div key={section.id} className="relative">
                        <div className="flex items-center gap-2 mb-1 px-0.5">
                            <h3 className="font-semibold text-xs uppercase tracking-wider text-app-muted">{section.name}</h3>
                            <div className="h-px flex-1 bg-app-border"></div>
                        </div>

                        <div className="bg-app-elevated border border-app-border overflow-hidden divide-y divide-app-border">
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
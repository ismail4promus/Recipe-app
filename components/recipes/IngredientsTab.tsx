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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-app-bg border border-app-border p-2 rounded-sm shadow-sm">
                <div className="flex items-center gap-6 pl-4">
                    <div className="flex items-center gap-3">
                        <Boxes className="h-4 w-4 text-app-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-app-muted">{recipe.ingredientSections.length} Phases Active</span>
                    </div>
                </div>
                <div className="flex bg-app-card p-1 rounded-sm border border-white/5 w-full sm:w-auto">
                    {(['original', 'metric', 'imperial'] as const).map((sys) => (
                        <button 
                            key={sys}
                            onClick={() => handleBatchConvert(sys)}
                            className={cn(
                                "flex-1 sm:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                activeSystem === sys 
                                    ? "text-white bg-app-primary rounded-sm shadow-lg" 
                                    : "text-app-muted hover:text-app-text"
                            )}
                        >
                            {sys}
                        </button>
                    ))}
                </div>
            </div>

            {unlinkedCount > 0 && (
                <div className="bg-app-warning/10 border border-app-warning/20 rounded-sm p-4 flex gap-4 items-center">
                    <AlertTriangle className="h-5 w-5 text-app-warning shrink-0" />
                    <p className="text-[10px] text-app-text font-black uppercase tracking-[0.2em]">
                        Warning: {unlinkedCount} Assets require linking for precise fiscal audit
                    </p>
                </div>
            )}

            <div className="space-y-12">
                {recipe.ingredientSections?.map((section, idx) => (
                    <div key={section.id} className="relative">
                        <div className="flex items-center gap-4 mb-4 px-2">
                            <h3 className="font-black text-xs uppercase tracking-[0.4em] text-app-text">Phase {idx + 1}: {section.name}</h3>
                            <div className="h-px flex-1 bg-app-border"></div>
                        </div>

                        <div className="bg-app-bg rounded-sm border border-app-border overflow-hidden divide-y divide-white/5">
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

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Ingredient, RecipeIngredient } from '../../types';
import { GripVertical, Search, X, Trash2, ArrowRightLeft } from 'lucide-react';
import { formatCurrency, cn, convertUnit, AVAILABLE_UNITS } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface IngredientRowProps {
    ingredient: RecipeIngredient;
    pantryIngredients: Ingredient[];
    onUpdate: (field: keyof RecipeIngredient, value: any) => void;
    onRemove: () => void;
    // Drag and Drop Props
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    isDragging?: boolean;
}

const INGREDIENT_TYPES = ["Whole", "Powder", "Liquid", "Paste", "Chopped", "Minced", "Sliced", "Diced", "Fillet", "Other"];

const IngredientRow: React.FC<IngredientRowProps> = React.memo(({ 
    ingredient, 
    pantryIngredients, 
    onUpdate, 
    onRemove,
    onDragStart,
    onDragOver,
    onDrop,
    isDragging 
}) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(ingredient.name || "");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSearchTerm(ingredient.name || "");
    }, [ingredient.name]);

    const filteredPantry = useMemo(() => {
        if (!searchTerm) return pantryIngredients.slice(0, 5);
        return pantryIngredients.filter(pi => 
            pi.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [pantryIngredients, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectIngredient = (pantryItem: Ingredient) => {
        onUpdate('ingredientId', pantryItem.id);
        onUpdate('name', pantryItem.name);
        onUpdate('unit', pantryItem.baseUnit); 
        setSearchTerm(pantryItem.name);
        setIsSearchOpen(false);
    };

    const handleUnlink = () => {
        onUpdate('ingredientId', '');
        onUpdate('name', '');
        onUpdate('quantity', 0);
        setSearchTerm("");
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleUnitChange = (newUnit: string) => {
        const oldUnit = ingredient.unit || 'g';
        const currentQty = ingredient.quantity || 0;
        
        const newQty = convertUnit(currentQty, oldUnit, newUnit);
        
        onUpdate('unit', newUnit);
        if (oldUnit !== newUnit) {
            onUpdate('quantity', parseFloat(newQty.toFixed(4)));
        }
    };

    const isLinked = !!ingredient.ingredientId;
    const linkedPantryItem = useMemo(() => 
        pantryIngredients.find(p => p.id === ingredient.ingredientId), 
    [ingredient.ingredientId, pantryIngredients]);
    
    const currentUnit = ingredient.unit || 'g';
    const normalizedQty = linkedPantryItem ? convertUnit(ingredient.quantity || 0, currentUnit, linkedPantryItem.baseUnit) : 0;
    const preciseCost = linkedPantryItem ? normalizedQty * linkedPantryItem.costPerUnit : 0;
    
    const isLowStock = linkedPantryItem ? linkedPantryItem.quantityInStock < normalizedQty : false;

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: isDragging ? 0.3 : 1, scale: isDragging ? 0.98 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={cn(
                "flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-2 rounded-xl border transition-all duration-200 group bg-app-card",
                isLinked
                    ? "border-app-success/40 bg-app-success/5"
                    : "border-app-border hover:border-app-primary/30",
                isDragging && "border-app-primary border-dashed shadow-soft ring-2 ring-app-primary/10"
            )}
            style={{ touchAction: 'none' }}
        >
            <div className="cursor-grab active:cursor-grabbing text-app-muted hidden sm:flex items-center self-center px-1 h-full">
                <GripVertical className="h-3.5 w-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="relative flex-grow w-full min-w-[140px]" ref={dropdownRef}>
                {isLinked ? (
                    <div className="flex items-center justify-between bg-app-elevated border border-app-success/40 rounded-full px-3 py-1.5 relative h-9">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-semibold text-sm text-app-text truncate">{ingredient.name}</span>
                        </div>
                        <button
                            aria-label="Unlink ingredient"
                            onClick={handleUnlink}
                            className="ml-2 p-1 hover:bg-app-danger/10 hover:text-app-danger rounded-full transition-colors text-app-muted"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted">
                            <Search className="h-3.5 w-3.5" />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                onUpdate('name', e.target.value);
                                setIsSearchOpen(true);
                            }}
                            onFocus={() => setIsSearchOpen(true)}
                            placeholder="Search ingredient…"
                            className="w-full pl-9 pr-3 h-9 text-sm rounded-full border border-app-border bg-app-elevated text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 transition-all placeholder:text-app-muted"
                        />
                        <AnimatePresence>
                            {isSearchOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute z-50 left-0 right-0 top-full mt-1 bg-app-card border border-app-border rounded-xl shadow-soft max-h-48 overflow-y-auto p-1"
                                >
                                    {filteredPantry.length > 0 ? (
                                        filteredPantry.map(pi => (
                                            <button
                                                key={pi.id}
                                                type="button"
                                                onClick={() => handleSelectIngredient(pi)}
                                                className="w-full text-left px-3 py-2 text-sm text-app-text hover:bg-app-muted/10 rounded-lg flex justify-between items-center group transition-colors"
                                            >
                                                <span>{pi.name}</span>
                                                <span className="text-xs text-app-muted">{pi.baseUnit}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-2 text-center text-xs text-app-muted">No matches.</div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto items-stretch">
                <div className="relative w-full sm:w-20 flex-shrink-0 group/qty">
                    <input
                        type="number"
                        aria-label="Quantity"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        value={ingredient.quantity || ''}
                        onChange={(e) => onUpdate('quantity', parseFloat(e.target.value))}
                        className={cn(
                            "w-full px-2 h-9 text-sm rounded-full border focus:outline-none transition-all font-semibold text-center",
                            isLowStock && isLinked
                                ? "border-app-danger/40 bg-app-danger/10 text-app-danger focus-visible:ring-2 focus-visible:ring-app-danger/40"
                                : "border-app-border bg-app-elevated text-app-text focus-visible:ring-2 focus-visible:ring-app-primary/60"
                        )}
                    />
                </div>

                <div className="w-full sm:w-20 flex-shrink-0 relative">
                     <select
                        value={currentUnit}
                        aria-label="Unit"
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className={cn(
                            "w-full px-2 h-9 text-sm rounded-full border bg-app-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 transition-all text-center appearance-none cursor-pointer",
                            isLinked ? "font-semibold text-app-primary" : "text-app-muted"
                        )}
                    >
                        {AVAILABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>

                <button
                    aria-label="Remove ingredient"
                    onClick={onRemove}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-app-muted hover:bg-app-danger/10 hover:text-app-danger border border-transparent transition-all shrink-0"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </motion.div>
    );
});

export default IngredientRow;

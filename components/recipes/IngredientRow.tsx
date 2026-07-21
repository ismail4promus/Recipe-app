
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
                "flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-2 rounded-lg border transition-all duration-200 group bg-card",
                isLinked 
                    ? "border-green-200 dark:border-green-900/40 bg-green-50/30 dark:bg-green-900/5" 
                    : "border-border/40 hover:border-primary/30",
                isDragging && "border-primary border-dashed shadow-lg ring-2 ring-primary/10"
            )}
            style={{ touchAction: 'none' }}
        >
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground hidden sm:flex items-center self-center px-1 h-full">
                <GripVertical className="h-3.5 w-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="relative flex-grow w-full min-w-[140px]" ref={dropdownRef}>
                {isLinked ? (
                    <div className="flex items-center justify-between bg-background border border-green-200 dark:border-green-800/50 rounded-md px-2.5 py-1.5 relative h-9">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-semibold text-sm text-foreground truncate">{ingredient.name}</span>
                        </div>
                        <button 
                            onClick={handleUnlink}
                            className="ml-2 p-1 hover:bg-red-50 hover:text-red-500 rounded transition-colors text-muted-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
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
                            placeholder="Search ingredient..."
                            className="w-full pl-8 pr-3 h-9 text-sm rounded-md border border-border bg-muted/20 focus:bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                        />
                        <AnimatePresence>
                            {isSearchOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto p-1"
                                >
                                    {filteredPantry.length > 0 ? (
                                        filteredPantry.map(pi => (
                                            <button
                                                key={pi.id}
                                                type="button"
                                                onClick={() => handleSelectIngredient(pi)}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex justify-between items-center group transition-colors"
                                            >
                                                <span>{pi.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{pi.baseUnit}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-2 text-center text-xs text-muted-foreground">No matches.</div>
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
                        placeholder="0"
                        min="0"
                        step="0.01"
                        value={ingredient.quantity || ''}
                        onChange={(e) => onUpdate('quantity', parseFloat(e.target.value))}
                        className={cn(
                            "w-full px-2 h-9 text-sm rounded-md border focus:outline-none transition-all font-semibold text-center",
                            isLowStock && isLinked
                                ? "border-red-300 bg-red-50 text-red-700 focus:ring-red-200" 
                                : "border-border bg-muted/20 focus:bg-background focus:ring-1 focus:ring-primary focus:border-primary"
                        )}
                    />
                </div>

                <div className="w-full sm:w-20 flex-shrink-0 relative">
                     <select 
                        value={currentUnit}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className={cn(
                            "w-full px-2 h-9 text-sm rounded-md border bg-muted/20 focus:bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all text-center appearance-none cursor-pointer hover:bg-muted/40",
                            isLinked ? "font-bold text-primary" : "text-muted-foreground"
                        )}
                    >
                        {AVAILABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>

                <button 
                    onClick={onRemove}
                    className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 border border-transparent transition-all shrink-0"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </motion.div>
    );
});

export default IngredientRow;

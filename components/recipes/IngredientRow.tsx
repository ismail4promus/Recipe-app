
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Ingredient, RecipeIngredient } from '../../types';
import { GripVertical, Search, X, Trash2, ArrowRightLeft, ChevronDown, AlertTriangle } from 'lucide-react';
import {
    formatCurrency, cn, UNIT_GROUPS, getUnit, normalizeUnitLoose, unitLabel,
    canConvert, baseUnitRatio, parseQuantity, formatQuantity, formatMeasure
} from '../../lib/utils';
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
    const [qtyText, setQtyText] = useState(() => (ingredient.quantity ? String(ingredient.quantity) : ''));
    const [showDetails, setShowDetails] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSearchTerm(ingredient.name || "");
    }, [ingredient.name]);

    // Keep the raw text while typing; only re-sync when the value changed elsewhere.
    useEffect(() => {
        if (parseQuantity(qtyText) !== (ingredient.quantity ?? null)) {
            setQtyText(ingredient.quantity ? String(ingredient.quantity) : '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ingredient.quantity]);

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

    const currentUnit = ingredient.unit || 'g';
    const currentUnitDef = getUnit(currentUnit);

    const handleSelectIngredient = (pantryItem: Ingredient) => {
        onUpdate('ingredientId', pantryItem.id);
        onUpdate('name', pantryItem.name);
        // Keep the cook's unit when it can be costed against the pantry item,
        // otherwise adopt the pantry item's base unit.
        if (!canConvert(currentUnit, pantryItem.baseUnit)) {
            onUpdate('unit', normalizeUnitLoose(pantryItem.baseUnit));
        }
        setSearchTerm(pantryItem.name);
        setIsSearchOpen(false);
    };

    const handleUnlink = () => {
        onUpdate('ingredientId', '');
        onUpdate('name', '');
        onUpdate('baseUnitPerUnit', undefined);
        setSearchTerm("");
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleQtyChange = (raw: string) => {
        setQtyText(raw);
        const parsed = parseQuantity(raw);
        if (parsed !== null) onUpdate('quantity', parsed);
    };

    const handleQtyBlur = () => {
        const parsed = parseQuantity(qtyText);
        if (parsed === null) {
            setQtyText(ingredient.quantity ? String(ingredient.quantity) : '');
        } else {
            const rounded = parseFloat(parsed.toFixed(4));
            onUpdate('quantity', rounded);
            setQtyText(String(rounded));
        }
    };

    const handleUnitChange = (newUnit: string) => {
        const oldUnit = currentUnit;
        if (oldUnit === newUnit) return;

        onUpdate('unit', newUnit);

        // Rescale the amount only when the two units measure the same thing.
        if (canConvert(oldUnit, newUnit)) {
            const oldDef = getUnit(oldUnit)!;
            const newDef = getUnit(newUnit)!;
            const converted = ((ingredient.quantity || 0) * oldDef.factor) / newDef.factor;
            const rounded = parseFloat(converted.toFixed(4));
            onUpdate('quantity', rounded);
            setQtyText(String(rounded));
        }
        // A manual bridge is tied to the old unit — it no longer means anything.
        if (ingredient.baseUnitPerUnit !== undefined) onUpdate('baseUnitPerUnit', undefined);
    };

    const isLinked = !!ingredient.ingredientId;
    const linkedPantryItem = useMemo(() =>
        pantryIngredients.find(p => p.id === ingredient.ingredientId),
    [ingredient.ingredientId, pantryIngredients]);

    const ratio = linkedPantryItem ? baseUnitRatio(ingredient, linkedPantryItem.baseUnit, linkedPantryItem.unitConversions) : null;
    const needsBridge = !!linkedPantryItem && ratio === null;

    const normalizedQty = ratio !== null ? (ingredient.quantity || 0) * ratio : 0;
    const preciseCost = ingredient.manualCostPerUnit !== undefined
        ? (ingredient.quantity || 0) * ingredient.manualCostPerUnit
        : linkedPantryItem && ratio !== null
            ? normalizedQty * linkedPantryItem.costPerUnit
            : 0;

    const isLowStock = linkedPantryItem && ratio !== null ? linkedPantryItem.quantityInStock < normalizedQty : false;
    const isUnknownUnit = !currentUnitDef;

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
                "flex flex-col gap-2 p-2 rounded-md border transition-all duration-200 group bg-app-card",
                isLinked
                    ? "border-app-success/40 bg-app-success/5"
                    : "border-app-border hover:border-app-primary/30",
                (needsBridge || isUnknownUnit) && "border-app-warning/50 bg-app-warning/5",
                isDragging && "border-app-primary border-dashed shadow-soft ring-2 ring-app-primary/10"
            )}
            style={{ touchAction: 'none' }}
        >
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="cursor-grab active:cursor-grabbing text-app-muted hidden sm:flex items-center self-center px-1 h-full">
                    <GripVertical className="h-3.5 w-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="relative flex-grow w-full min-w-[140px]" ref={dropdownRef}>
                    {isLinked ? (
                        <div className="flex items-center justify-between bg-app-elevated border border-app-success/40 rounded-md px-3 py-1.5 relative h-9">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="font-semibold text-sm text-app-text truncate">{ingredient.name}</span>
                            </div>
                            <button
                                type="button"
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
                                className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-app-border bg-app-elevated text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 transition-all placeholder:text-app-muted"
                            />
                            <AnimatePresence>
                                {isSearchOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute z-50 left-0 right-0 top-full mt-1 bg-app-card border border-app-border rounded-md shadow-soft max-h-48 overflow-y-auto p-1"
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
                                                    <span className="text-xs text-app-muted">{unitLabel(pi.baseUnit)}</span>
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
                    <div className="relative w-full sm:w-[86px] flex-shrink-0">
                        <input
                            type="text"
                            inputMode="decimal"
                            aria-label="Quantity"
                            placeholder="0"
                            title="Accepts decimals and fractions — 1.5, 1 1/2, ¾"
                            value={qtyText}
                            onChange={(e) => handleQtyChange(e.target.value)}
                            onBlur={handleQtyBlur}
                            className={cn(
                                "w-full px-2 h-9 text-sm rounded-md border focus:outline-none transition-all font-semibold text-center",
                                isLowStock
                                    ? "border-app-danger/40 bg-app-danger/10 text-app-danger focus-visible:ring-2 focus-visible:ring-app-danger/40"
                                    : parseQuantity(qtyText) === null && qtyText !== ''
                                        ? "border-app-warning/50 bg-app-warning/10 text-app-warning focus-visible:ring-2 focus-visible:ring-app-warning/40"
                                        : "border-app-border bg-app-elevated text-app-text focus-visible:ring-2 focus-visible:ring-app-primary/60"
                            )}
                        />
                    </div>

                    <div className="w-full sm:w-24 flex-shrink-0 relative">
                        <select
                            value={currentUnit}
                            aria-label="Unit"
                            onChange={(e) => handleUnitChange(e.target.value)}
                            className={cn(
                                "w-full px-2 h-9 text-sm rounded-md border bg-app-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 transition-all text-center appearance-none cursor-pointer",
                                isUnknownUnit ? "border-app-warning/50 text-app-warning font-semibold" : "border-app-border",
                                !isUnknownUnit && (isLinked ? "font-semibold text-app-primary" : "text-app-muted")
                            )}
                        >
                            {isUnknownUnit && <option value={currentUnit}>{currentUnit} (?)</option>}
                            {UNIT_GROUPS.map(group => (
                                <optgroup key={group.dimension} label={group.label}>
                                    {group.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        aria-label={showDetails ? "Hide details" : "Show details"}
                        onClick={() => setShowDetails(v => !v)}
                        className={cn(
                            "w-9 h-9 flex items-center justify-center rounded-full border border-transparent transition-all shrink-0 text-app-muted hover:text-app-primary hover:bg-app-primary/10",
                            showDetails && "bg-app-primary/10 text-app-primary"
                        )}
                    >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", showDetails && "rotate-180")} />
                    </button>

                    <button
                        type="button"
                        aria-label="Remove ingredient"
                        onClick={onRemove}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-app-muted hover:bg-app-danger/10 hover:text-app-danger border border-transparent transition-all shrink-0"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Status line — cost, stock and unit problems */}
            {(isLinked || ingredient.notes || isUnknownUnit) && (
                <div className="flex flex-wrap items-center gap-2 pl-1 sm:pl-7 text-[11px]">
                    {isUnknownUnit && (
                        <span className="inline-flex items-center gap-1 font-medium text-app-warning bg-app-warning/10 border border-app-warning/20 px-1.5 py-0.5 rounded-sm">
                            <AlertTriangle className="h-3 w-3" /> Unrecognized unit "{currentUnit}"
                        </span>
                    )}
                    {needsBridge && linkedPantryItem && (
                        <span className="inline-flex items-center gap-1 font-medium text-app-warning bg-app-warning/10 border border-app-warning/20 px-1.5 py-0.5 rounded-sm">
                            <ArrowRightLeft className="h-3 w-3" />
                            {unitLabel(currentUnit)} → {unitLabel(linkedPantryItem.baseUnit)} needs a conversion
                        </span>
                    )}
                    {isLinked && !needsBridge && (
                        <>
                            <span className="font-semibold text-app-text tabular-nums">{formatCurrency(preciseCost)}</span>
                            {linkedPantryItem && ratio !== null && (
                                <span className="text-app-muted">
                                    = {formatMeasure(normalizedQty, linkedPantryItem.baseUnit)} of stock
                                </span>
                            )}
                            {isLowStock && (
                                <span className="font-medium text-app-danger bg-app-danger/10 px-1.5 py-0.5 rounded-sm">Low stock</span>
                            )}
                        </>
                    )}
                    {ingredient.notes && !showDetails && (
                        <span className="text-app-muted truncate max-w-[220px]">{ingredient.notes}</span>
                    )}
                </div>
            )}

            <AnimatePresence initial={false}>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 pl-1 sm:pl-7 border-t border-app-border/60">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-app-muted">Preparation</label>
                                <select
                                    value={ingredient.type || ''}
                                    onChange={(e) => onUpdate('type', e.target.value || undefined)}
                                    className="w-full h-9 px-2 text-sm rounded-md border border-app-border bg-app-elevated text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 appearance-none cursor-pointer"
                                >
                                    <option value="">—</option>
                                    {INGREDIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-[11px] font-medium text-app-muted">Note (e.g. "1 cup, packed")</label>
                                <input
                                    type="text"
                                    value={ingredient.notes || ''}
                                    onChange={(e) => onUpdate('notes', e.target.value || undefined)}
                                    placeholder="Optional note…"
                                    className="w-full h-9 px-3 text-sm rounded-md border border-app-border bg-app-elevated text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 placeholder:text-app-muted"
                                />
                            </div>

                            {linkedPantryItem && !canConvert(currentUnit, linkedPantryItem.baseUnit) && (
                                <div className="space-y-1 sm:col-span-3">
                                    <label className="text-[11px] font-medium text-app-muted flex items-center gap-1">
                                        <ArrowRightLeft className="h-3 w-3" />
                                        Conversion — 1 {unitLabel(currentUnit)} equals how many {unitLabel(linkedPantryItem.baseUnit)}?
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-app-muted whitespace-nowrap">1 {unitLabel(currentUnit)} =</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={ingredient.baseUnitPerUnit ?? ''}
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                onUpdate('baseUnitPerUnit', Number.isFinite(v) && v > 0 ? v : undefined);
                                            }}
                                            placeholder="0"
                                            className="w-28 h-9 px-2 text-sm rounded-md border border-app-border bg-app-elevated text-app-text font-semibold text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                                        />
                                        <span className="text-sm font-medium text-app-muted">{unitLabel(linkedPantryItem.baseUnit)}</span>
                                        {ratio !== null && (
                                            <span className="text-[11px] text-app-muted">
                                                → {formatQuantity(ingredient.quantity || 0, currentUnit)} {unitLabel(currentUnit)} = {formatMeasure(normalizedQty, linkedPantryItem.baseUnit)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

export default IngredientRow;

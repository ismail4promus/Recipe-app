import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, X, Save } from 'lucide-react';
import { Ingredient } from '../../types';

export const QuickEditIngredientModal: React.FC<{
    ingredient: Ingredient;
    onClose: () => void;
    onSave: (updated: Ingredient) => void;
}> = ({ ingredient, onClose, onSave }) => {
    const [price, setPrice] = useState(ingredient.costPerPackage);
    const [stock, setStock] = useState(ingredient.packagesInStock);

    const handleSave = () => {
        const updated = {
            ...ingredient,
            costPerPackage: price,
            packagesInStock: stock,
            costPerUnit: ingredient.packageSize > 0 ? price / ingredient.packageSize : 0,
            quantityInStock: stock * ingredient.packageSize,
            last_verified: new Date()
        };
        onSave(updated);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-app-card w-full max-w-sm rounded-lg border border-app-border shadow-soft overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-app-border bg-app-elevated/50 flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-app-text flex items-center gap-2">
                        <Package className="h-4 w-4 text-app-primary" /> Update Inventory
                    </h3>
                    <button aria-label="Close" onClick={onClose}><X className="h-4 w-4 text-app-muted hover:text-app-text" /></button>
                </div>
                <div className="p-5 space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-app-muted">Cost Per {ingredient.packageUnit}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-app-muted">$</span>
                            <input
                                type="number" min="0" step="0.01"
                                aria-label={`Cost per ${ingredient.packageUnit}`}
                                value={price} onChange={e => setPrice(parseFloat(e.target.value))}
                                className="w-full pl-7 pr-3 h-11 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm font-semibold text-app-text transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-app-muted">{ingredient.packageUnit}s In Stock</label>
                        <div className="flex items-center gap-2">
                            <button aria-label="Decrease stock" onClick={() => setStock(Math.max(0, stock - 1))} className="h-11 w-11 rounded-full bg-app-elevated hover:bg-app-muted/10 font-semibold text-app-text border border-app-border transition-colors">-</button>
                            <input
                                type="number" min="0"
                                aria-label="Stock quantity"
                                value={stock} onChange={e => setStock(parseFloat(e.target.value))}
                                className="flex-1 h-11 text-center rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm font-semibold text-app-text transition-all"
                            />
                            <button aria-label="Increase stock" onClick={() => setStock(stock + 1)} className="h-11 w-11 rounded-full bg-app-elevated hover:bg-app-muted/10 font-semibold text-app-text border border-app-border transition-colors">+</button>
                        </div>
                    </div>
                    <button onClick={handleSave} className="w-full min-h-[44px] bg-app-primary text-primary-foreground rounded-full font-semibold text-sm hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                        <Save className="h-4 w-4" /> Save Changes
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
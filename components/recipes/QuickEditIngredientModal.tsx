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
                className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" /> Update Inventory
                    </h3>
                    <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
                </div>
                <div className="p-5 space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cost Per {ingredient.packageUnit}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">$</span>
                            <input 
                                type="number" min="0" step="0.01"
                                value={price} onChange={e => setPrice(parseFloat(e.target.value))}
                                className="w-full pl-7 pr-3 h-11 rounded-xl bg-muted/20 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{ingredient.packageUnit}s In Stock</label>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setStock(Math.max(0, stock - 1))} className="h-11 w-11 rounded-xl bg-muted hover:bg-muted/80 font-bold border border-border transition-colors">-</button>
                            <input 
                                type="number" min="0"
                                value={stock} onChange={e => setStock(parseFloat(e.target.value))}
                                className="flex-1 h-11 text-center rounded-xl bg-muted/20 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold transition-all"
                            />
                            <button onClick={() => setStock(stock + 1)} className="h-11 w-11 rounded-xl bg-muted hover:bg-muted/80 font-bold border border-border transition-colors">+</button>
                        </div>
                    </div>
                    <button onClick={handleSave} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                        <Save className="h-4 w-4" /> Save Changes
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
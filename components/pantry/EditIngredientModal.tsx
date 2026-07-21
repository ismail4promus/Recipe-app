import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ingredient } from '../../types';
import { Edit, X, Tag, Scale, Box, DollarSign, Calendar, Save, Trash2, Crosshair, Package } from 'lucide-react';
import { formatCurrency, AVAILABLE_UNITS, cn } from '../../lib/utils';
import { useData } from '../../context/DataContext';

const CATEGORIES = ["Protein", "Vegetable", "Fruit", "Grains", "Dairy", "Spices", "Oils & Fats", "Baking", "Condiments", "Beverage", "Other"];
const PACKAGE_TYPES = ["pack", "box", "bag", "bottle", "can", "jar", "container", "crate", "kg", "liter", "piece"];

export const EditIngredientModal: React.FC<{
  ingredient: Ingredient;
  onClose: () => void;
  onSave: (updatedIngredient: Ingredient) => void;
}> = ({ ingredient, onClose, onSave }) => {
  const { deleteIngredient } = useData();
  const [formData, setFormData] = useState<Partial<Ingredient>>(ingredient);

  useEffect(() => {
    setFormData(ingredient);
  }, [ingredient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData: Ingredient = { ...ingredient, ...formData, last_verified: new Date() } as Ingredient;
    if (updatedData.costPerPackage != null && updatedData.packageSize > 0) {
        updatedData.costPerUnit = updatedData.costPerPackage / updatedData.packageSize;
    }
    if (updatedData.packagesInStock != null && updatedData.packageSize > 0) {
        updatedData.quantityInStock = updatedData.packagesInStock * updatedData.packageSize;
    }
    onSave(updatedData);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete ${ingredient.name}?`)) {
        deleteIngredient(ingredient.id);
        onClose();
    }
  };

  const calculatedUnitCost = (formData.costPerPackage || 0) / (formData.packageSize || 1);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }}
        className="bg-app-card rounded-lg shadow-soft w-full max-w-lg overflow-hidden border border-app-border relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-app-elevated p-6 border-b border-app-border flex justify-between items-center relative z-10">
            <div>
                <h2 className="text-xl font-bold text-app-text tracking-tight flex items-center gap-3 leading-none">
                    <Edit className="h-5 w-5 text-app-primary" /> Edit Item
                </h2>
                <p className="text-xs text-app-muted font-medium mt-1.5">{ingredient.name}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="h-11 w-11 flex items-center justify-center hover:bg-app-muted/10 rounded-full transition-colors text-app-muted">
                <X className="h-5 w-5" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto scrollbar-hide relative z-10">
            {/* Identity Group */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-app-primary" />
                    <h3 className="text-xs text-app-muted font-medium">Item details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                        <label className="text-xs text-app-muted font-medium block ml-1">Name</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text" required />
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs text-app-muted font-medium block ml-1">Category</label>
                         <select name="category" value={formData.category} onChange={handleChange} className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text appearance-none">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-app-muted font-medium block ml-1">Supplier</label>
                        <input name="supplier" value={formData.supplier} onChange={handleChange} className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text" />
                    </div>
                </div>
            </div>

            <div className="h-px bg-app-border"></div>

            {/* Packaging Group */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Scale className="h-4 w-4 text-app-primary" />
                    <h3 className="text-xs text-app-muted font-medium">Packaging</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs text-app-muted font-medium block ml-1">Base unit</label>
                        <select name="baseUnit" value={formData.baseUnit} onChange={handleChange} className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text appearance-none">
                            {AVAILABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-app-muted font-medium block ml-1">Package type</label>
                        <select name="packageUnit" value={formData.packageUnit} onChange={handleChange} className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text appearance-none">
                            {PACKAGE_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-app-muted font-medium block ml-1">Package size</label>
                        <input type="number" name="packageSize" value={formData.packageSize} onChange={handleChange} className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text tabular-nums" required />
                    </div>
                </div>
                <div className="bg-app-elevated p-3 rounded-md border border-app-border text-xs font-medium flex items-center justify-center gap-3 text-app-primary">
                    <Box className="h-3.5 w-3.5" />
                    <span>1 {formData.packageUnit} = {formData.packageSize} {formData.baseUnit}</span>
                </div>
            </div>

            <div className="h-px bg-app-border"></div>

            {/* Inventory Group */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-app-primary" />
                    <h3 className="text-xs text-app-muted font-medium">Stock and cost</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs text-app-muted font-medium block ml-1">In stock</label>
                        <input type="number" name="packagesInStock" value={formData.packagesInStock} onChange={handleChange} className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text tabular-nums" required />
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs text-app-muted font-medium block ml-1">Cost / pack</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-app-muted">$</span>
                            <input type="number" name="costPerPackage" value={formData.costPerPackage} onChange={handleChange} className="w-full min-h-[44px] pl-8 pr-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text tabular-nums" required />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-5 rounded-md bg-app-elevated border border-app-border">
                    <div className="text-xs text-app-muted font-medium">Unit cost</div>
                    <div className="text-lg font-bold text-app-text tabular-nums tracking-tight">
                        {formatCurrency(calculatedUnitCost)} <span className="text-xs text-app-muted font-medium">/ {formData.baseUnit}</span>
                    </div>
                </div>
            </div>

            <div className="pt-2 flex justify-between items-center gap-4">
                <button
                    type="button" onClick={handleDelete}
                    className="min-h-[44px] px-6 rounded-md text-sm font-semibold text-app-danger hover:bg-app-danger/10 transition-all flex items-center gap-2"
                >
                    <Trash2 className="h-4 w-4" /> Delete
                </button>
                <div className="flex gap-4">
                    <button type="button" onClick={onClose} className="min-h-[44px] px-8 rounded-md text-sm font-semibold text-app-muted hover:text-app-text transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="min-h-[44px] px-10 rounded-md bg-app-primary text-primary-foreground text-sm font-semibold shadow-soft hover:brightness-105 active:scale-[0.97] transition-all flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" /> Save
                    </button>
                </div>
            </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
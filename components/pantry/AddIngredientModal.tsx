import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, X, Tag, Package, DollarSign, Scale, Calendar, Save, Crosshair, Box } from 'lucide-react';
import { AVAILABLE_UNITS, formatCurrency, cn } from '../../lib/utils';

const CATEGORIES = ["Protein", "Vegetable", "Fruit", "Grains", "Dairy", "Spices", "Oils & Fats", "Baking", "Condiments", "Beverage", "Other"];

export const AddIngredientModal: React.FC<{
    onClose: () => void;
    onSave: (newIngredient: any) => void;
}> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'Vegetable',
        supplier: '',
        baseUnit: 'g',
        packageUnit: 'pack',
        packageSize: 1,
        packagesInStock: 0,
        costPerPackage: 0,
        shelf_life_days: 7,
    });

    const costPerUnit = formData.packageSize > 0 ? formData.costPerPackage / formData.packageSize : 0;
    const totalQty = formData.packagesInStock * formData.packageSize;

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newIngredient = {
            id: `ing_${Date.now()}`,
            ...formData,
            last_verified: new Date(),
            quantityInStock: totalQty,
            costPerUnit: costPerUnit,
            wastePercentage: 0, // Default
        };
        onSave(newIngredient);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-2.5 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }}
                className="bg-app-card rounded-lg shadow-soft w-full max-w-lg overflow-hidden border border-app-border relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-app-elevated p-3 border-b border-app-border flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-app-text tracking-tight flex items-center gap-3 leading-none">
                            <PlusCircle className="h-5 w-5 text-app-primary" /> Add Inventory Item
                        </h2>
                        <p className="text-xs text-app-muted font-medium mt-1.5">Enter item details</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="h-11 w-11 flex items-center justify-center hover:bg-app-muted/10 rounded-full transition-colors text-app-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-2.5 space-y-2.5 max-h-[80vh] overflow-y-auto scrollbar-hide relative z-10">
                    
                    {/* Identification Section */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                            <Tag className="h-4 w-4 text-app-primary" />
                            <h3 className="text-xs text-app-muted font-medium">Item details</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="col-span-2 space-y-2">
                                <label className="text-xs text-app-muted font-medium block ml-1">Name</label>
                                <input
                                    required autoFocus value={formData.name} onChange={e => handleChange('name', e.target.value)}
                                    placeholder="Item name…"
                                    className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text placeholder:text-app-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-app-muted font-medium block ml-1">Category</label>
                                <select
                                    value={formData.category} onChange={e => handleChange('category', e.target.value)}
                                    className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text appearance-none cursor-pointer"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-app-muted font-medium block ml-1">Supplier</label>
                                <input
                                    value={formData.supplier} onChange={e => handleChange('supplier', e.target.value)}
                                    placeholder="Supplier…"
                                    className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text placeholder:text-app-muted"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-app-border"></div>

                    {/* Logistics Section */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-app-primary" />
                            <h3 className="text-xs text-app-muted font-medium">Packaging</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="space-y-2">
                                <label className="text-xs text-app-muted font-medium block ml-1">Base unit</label>
                                <select
                                    value={formData.baseUnit} onChange={e => handleChange('baseUnit', e.target.value)}
                                    className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text appearance-none"
                                >
                                    {AVAILABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-xs text-app-muted font-medium block ml-1">Package size</label>
                                <div className="relative">
                                    <input
                                        type="number" step="any" min="0.01" required value={formData.packageSize} onChange={e => handleChange('packageSize', parseFloat(e.target.value))}
                                        className="w-full min-h-[44px] pl-4 pr-16 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text tabular-nums"
                                    />
                                    <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none">
                                        <span className="text-xs font-medium text-app-primary bg-app-primary/10 px-2 py-1 rounded-md">
                                            {formData.baseUnit}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-app-elevated p-2.5 rounded-md border border-app-border flex items-center justify-between group">
                            <div className="space-y-1.5 flex-1">
                                <label className="text-xs font-medium text-app-primary block">Quantity in stock</label>
                                <input
                                    type="number" min="0" required value={formData.packagesInStock} onChange={e => handleChange('packagesInStock', parseFloat(e.target.value))}
                                    className="bg-transparent border-none outline-none text-2xl font-bold text-app-text tabular-nums w-full"
                                    placeholder="0"
                                />
                            </div>
                            <div className="text-right border-l border-app-border pl-6 min-w-[120px]">
                                <span className="text-xs font-medium text-app-muted block mb-1">Total quantity</span>
                                <span className="text-lg font-bold text-app-success tabular-nums">
                                    {totalQty} <span className="text-xs font-medium">{formData.baseUnit}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Readout Section */}
                    <div className="space-y-2.5 pt-4 border-t border-app-border">
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-4 w-4 text-app-primary" />
                                    <h3 className="text-xs text-app-muted font-medium">Cost</h3>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-app-muted font-medium block ml-1">Price / pack</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-app-muted">$</span>
                                        <input
                                            type="number" step="0.01" min="0" required value={formData.costPerPackage} onChange={e => handleChange('costPerPackage', parseFloat(e.target.value))}
                                            className="w-full min-h-[44px] pl-8 pr-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text tabular-nums"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-app-primary/10 rounded-md p-2.5 border border-app-primary/20 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2">
                                    <Scale className="h-4 w-4 text-app-primary" />
                                    <span className="text-xs font-medium text-app-primary">Unit cost</span>
                                </div>
                                <div className="text-2xl font-bold text-app-text tabular-nums tracking-tight">
                                    {formatCurrency(costPerUnit)}
                                    <span className="text-xs font-medium text-app-muted ml-2">/ {formData.baseUnit}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-app-border flex gap-2.5">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs text-app-muted font-medium block flex items-center gap-2"><Calendar className="h-3 w-3"/> Shelf life (days)</label>
                             <input
                                type="number" min="1" value={formData.shelf_life_days} onChange={e => handleChange('shelf_life_days', parseFloat(e.target.value))}
                                className="w-full min-h-[44px] px-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text tabular-nums"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2.5">
                        <button type="button" onClick={onClose} className="min-h-[44px] px-8 rounded-md text-sm font-semibold text-app-muted hover:text-app-text transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="min-h-[44px] px-10 rounded-md bg-app-primary text-primary-foreground text-sm font-semibold shadow-soft hover:brightness-105 active:scale-[0.97] transition-all flex items-center gap-3"
                        >
                            <Save className="h-4 w-4" /> Save Item
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};
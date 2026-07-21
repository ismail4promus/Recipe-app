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
    if (window.confirm(`Critical Process: Confirm permanent purge of ${ingredient.name}?`)) {
        deleteIngredient(ingredient.id);
        onClose();
    }
  };

  const calculatedUnitCost = (formData.costPerPackage || 0) / (formData.packageSize || 1);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }}
        className="bg-app-card rounded-sm shadow-2xl w-full max-w-lg overflow-hidden border border-app-border relative"
        onClick={e => e.stopPropagation()}
      >
        <Crosshair className="absolute top-4 right-4 h-16 w-16 text-white/[0.02] pointer-events-none" />

        <div className="bg-white/[0.02] p-6 border-b border-app-border flex justify-between items-center relative z-10">
            <div>
                <h2 className="text-xl font-black text-app-text uppercase tracking-tighter flex items-center gap-3 leading-none">
                    <Edit className="h-5 w-5 text-app-primary" /> Calibrate Asset
                </h2>
                <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.3em] mt-1.5">Asset_ID: {ingredient.id.toUpperCase()}</p>
            </div>
            <button onClick={onClose} className="h-10 w-10 flex items-center justify-center hover:bg-white/5 rounded-sm transition-colors text-app-muted">
                <X className="h-5 w-5" />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide relative z-10">
            {/* Identity Group */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-app-primary" />
                    <h3 className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em]">Unit Identity</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                        <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Protocol Name</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-xs font-black uppercase tracking-widest" required />
                    </div>
                    <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Classification</label>
                         <select name="category" value={formData.category} onChange={handleChange} className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-xs font-black uppercase tracking-widest appearance-none">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Source Node</label>
                        <input name="supplier" value={formData.supplier} onChange={handleChange} className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-xs font-black uppercase tracking-widest" />
                    </div>
                </div>
            </div>

            <div className="h-px bg-white/5"></div>

            {/* Packaging Group */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Scale className="h-4 w-4 text-app-primary" />
                    <h3 className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em]">Volume Parameters</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Base_UOM</label>
                        <select name="baseUnit" value={formData.baseUnit} onChange={handleChange} className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-xs font-black uppercase appearance-none">
                            {AVAILABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Unit Class</label>
                        <select name="packageUnit" value={formData.packageUnit} onChange={handleChange} className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-xs font-black uppercase appearance-none">
                            {PACKAGE_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Net Load</label>
                        <input type="number" name="packageSize" value={formData.packageSize} onChange={handleChange} className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-sm font-black tabular-nums" required />
                    </div>
                </div>
                <div className="bg-app-bg p-3 rounded-sm border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 text-app-primary">
                    <Box className="h-3.5 w-3.5" />
                    <span>Ratio: 1 {formData.packageUnit} // {formData.packageSize} {formData.baseUnit} Load</span>
                </div>
            </div>

            <div className="h-px bg-white/5"></div>

            {/* Inventory Group */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-app-primary" />
                    <h3 className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em]">Inventory Calibration</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Operational Stock</label>
                        <input type="number" name="packagesInStock" value={formData.packagesInStock} onChange={handleChange} className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-sm font-black tabular-nums" required />
                    </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Mkt_Pack_Cost</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-app-muted">$</span>
                            <input type="number" name="costPerPackage" value={formData.costPerPackage} onChange={handleChange} className="w-full h-12 pl-8 pr-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-sm font-black tabular-nums" required />
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between p-5 rounded-sm bg-white/[0.02] border border-white/5">
                    <div className="text-[9px] font-black uppercase text-app-muted tracking-widest">Effective Unit Cost</div>
                    <div className="text-lg font-black text-app-text tabular-nums tracking-tight">
                        {formatCurrency(calculatedUnitCost)} <span className="text-[10px] text-app-muted uppercase">/ {formData.baseUnit}</span>
                    </div>
                </div>
            </div>

            <div className="pt-2 flex justify-between items-center gap-4">
                <button 
                    type="button" onClick={handleDelete}
                    className="h-12 px-6 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/5 transition-all flex items-center gap-2"
                >
                    <Trash2 className="h-4 w-4" /> Purge Asset
                </button>
                <div className="flex gap-4">
                    <button type="button" onClick={onClose} className="h-12 px-8 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] text-app-muted hover:text-app-text transition-colors">
                        Abort
                    </button>
                    <button 
                        type="submit" 
                        className="h-12 px-10 rounded-sm bg-app-primary text-app-bg font-black uppercase tracking-[0.2em] hover:bg-app-primary/90 transition-all flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" /> Save Protocol
                    </button>
                </div>
            </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
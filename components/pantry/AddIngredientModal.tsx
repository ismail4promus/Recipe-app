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
                            <PlusCircle className="h-5 w-5 text-app-primary" /> Initialize Asset
                        </h2>
                        <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.3em] mt-1.5">Module Specification Entry</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center hover:bg-white/5 rounded-sm transition-colors text-app-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide relative z-10">
                    
                    {/* Identification Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Tag className="h-4 w-4 text-app-primary" />
                            <h3 className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em]">Asset Identification</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Asset Name</label>
                                <input 
                                    required autoFocus value={formData.name} onChange={e => handleChange('name', e.target.value)}
                                    placeholder="MODULE_LABEL..."
                                    className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary transition-all text-xs font-black uppercase tracking-widest placeholder:text-white/5"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Sector Class</label>
                                <select 
                                    value={formData.category} onChange={e => handleChange('category', e.target.value)}
                                    className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary transition-all text-xs font-black uppercase tracking-widest appearance-none cursor-pointer"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Source Vendor</label>
                                <input 
                                    value={formData.supplier} onChange={e => handleChange('supplier', e.target.value)}
                                    placeholder="SUPPLIER_ID..."
                                    className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary transition-all text-xs font-black uppercase tracking-widest placeholder:text-white/5"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5"></div>

                    {/* Logistics Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-app-primary" />
                            <h3 className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em]">Logistics Data</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Base_UOM</label>
                                <select 
                                    value={formData.baseUnit} onChange={e => handleChange('baseUnit', e.target.value)}
                                    className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary transition-all text-xs font-black uppercase tracking-widest appearance-none"
                                >
                                    {AVAILABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Container Size</label>
                                <div className="relative">
                                    <input 
                                        type="number" step="any" min="0.01" required value={formData.packageSize} onChange={e => handleChange('packageSize', parseFloat(e.target.value))}
                                        className="w-full h-12 pl-4 pr-16 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-sm font-black tabular-nums"
                                    />
                                    <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none">
                                        <span className="text-[9px] font-black uppercase text-app-primary bg-app-primary/10 px-2 py-1 rounded-sm">
                                            {formData.baseUnit}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-app-bg p-5 rounded-sm border border-app-border flex items-center justify-between group shadow-inner">
                            <div className="space-y-1.5 flex-1">
                                <label className="text-[9px] font-black text-app-primary uppercase tracking-[0.2em] block">Vault_Entry_Qty</label>
                                <input 
                                    type="number" min="0" required value={formData.packagesInStock} onChange={e => handleChange('packagesInStock', parseFloat(e.target.value))}
                                    className="bg-transparent border-none outline-none text-2xl font-black text-app-text tabular-nums w-full"
                                    placeholder="0"
                                />
                            </div>
                            <div className="text-right border-l border-white/5 pl-6 min-w-[120px]">
                                <span className="text-[8px] uppercase font-black text-app-muted tracking-widest block mb-1">Total_Yield</span>
                                <span className="text-lg font-black text-app-success tabular-nums">
                                    {totalQty} <span className="text-[10px] uppercase font-bold">{formData.baseUnit}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Readout Section */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-4 w-4 text-app-primary" />
                                    <h3 className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em]">Fiscal Basis</h3>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-app-muted tracking-widest block ml-1">Price / Pack</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-app-muted">$</span>
                                        <input 
                                            type="number" step="0.01" min="0" required value={formData.costPerPackage} onChange={e => handleChange('costPerPackage', parseFloat(e.target.value))}
                                            className="w-full h-12 pl-8 pr-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-sm font-black tabular-nums"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-app-primary/5 rounded-sm p-5 border border-app-primary/20 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2">
                                    <Scale className="h-4 w-4 text-app-primary" />
                                    <span className="text-[9px] uppercase font-black text-app-primary tracking-[0.2em]">CALC_UNIT_VAL</span>
                                </div>
                                <div className="text-2xl font-black text-app-text tabular-nums tracking-tighter">
                                    {formatCurrency(costPerUnit)}
                                    <span className="text-[10px] font-bold uppercase text-app-muted ml-2">/ {formData.baseUnit}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-[9px] font-black text-app-muted uppercase tracking-[0.2em] block flex items-center gap-2"><Calendar className="h-3 w-3"/> Chrono_Limit (Days)</label>
                             <input 
                                type="number" min="1" value={formData.shelf_life_days} onChange={e => handleChange('shelf_life_days', parseFloat(e.target.value))}
                                className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-sm font-black tabular-nums"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="h-12 px-8 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] text-app-muted hover:text-app-text transition-colors">
                            Abort
                        </button>
                        <button 
                            type="submit" 
                            className="h-12 px-10 rounded-sm bg-app-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Save className="h-4 w-4" /> Commit Asset
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};
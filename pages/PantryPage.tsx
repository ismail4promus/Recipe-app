import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { 
    Search, PlusCircle, Layers, X, LayoutGrid, 
    List as ListIcon, Trash2, Boxes, Activity, Warehouse,
    ShieldAlert, BarChart3, Package
} from 'lucide-react';
import { formatCurrency, cn, ANIMATION_VARIANTS } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Ingredient } from '../types';
import { BatchUpdateModal } from '../components/pantry/BatchUpdateModal';
import { AddIngredientModal } from '../components/pantry/AddIngredientModal';
import { EditIngredientModal } from '../components/pantry/EditIngredientModal';
import { PantryItemCard } from '../components/pantry/PantryItemCard';

const CATEGORIES = ["Protein", "Vegetable", "Fruit", "Grains", "Dairy", "Spices", "Oils & Fats", "Baking", "Condiments", "Beverage", "Other"];

export default function PantryPage() {
    const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useData();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [groupByCategory, setGroupByCategory] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'stock' | 'cost'>('stock');

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const totalValue = ingredients.reduce((sum, item) => sum + (item.costPerPackage * item.packagesInStock), 0);
    const lowStockCount = ingredients.filter(i => i.packagesInStock <= 2).length;
    const expiringSoonCount = ingredients.filter(i => {
         if (!i.last_verified) return false;
         const expiry = new Date(i.last_verified);
         expiry.setDate(expiry.getDate() + (i.shelf_life_days || 365));
         const diff = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
         return diff <= 7;
    }).length;

    const filteredIngredients = useMemo(() => {
        let items = ingredients.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === "All" || item.category === filterCategory;
            return matchesSearch && matchesCategory;
        });

        return items.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'stock') return a.packagesInStock - b.packagesInStock;
            if (sortBy === 'cost') return b.costPerUnit - a.costPerUnit;
            return 0;
        });
    }, [ingredients, searchQuery, filterCategory, sortBy]);

    const groupedIngredients: Record<string, Ingredient[]> = useMemo(() => {
        if (!groupByCategory) return { 'Active Inventory': filteredIngredients };
        return filteredIngredients.reduce((groups, item) => {
            const cat = item.category || 'Other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
            return groups;
        }, {} as Record<string, Ingredient[]>);
    }, [filteredIngredients, groupByCategory]);

    const handleBatchDelete = useCallback(() => {
        if (window.confirm(`Purge ${selectedIds.size} selected SKUs from manifest?`)) {
            selectedIds.forEach(id => deleteIngredient(id));
            setSelectedIds(new Set());
            setIsSelectionMode(false);
        }
    }, [selectedIds, deleteIngredient]);

    return (
        <motion.div 
            initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container}
            className="space-y-6 max-w-7xl mx-auto pb-24 px-4 md:px-0"
        >
            {/* Header / Command Strip */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-app-border pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Warehouse className="h-6 w-6 text-app-primary" />
                        <h1 className="text-3xl font-black tracking-tighter text-app-text uppercase">Asset Vault</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="status-pulse bg-app-success shadow-[0_0_8px_#1cbb8c]"></span>
                            <span className="tactical-label">Vault Integrity: Optimized</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setShowAddModal(true)}
                    className="h-11 px-8 bg-app-primary text-white rounded-md tactical-label flex items-center gap-3 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                    <PlusCircle className="h-4 w-4" /> Initialize Asset
                </button>
            </motion.div>

            {/* Instrumentation Grid */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Gross_Equity', val: formatCurrency(totalValue).split('.')[0], icon: BarChart3, color: 'text-app-text' },
                    { label: 'Total_SKU', val: ingredients.length, icon: Boxes, color: 'text-app-primary' },
                    { label: 'Low_Stock', val: lowStockCount, icon: ShieldAlert, color: 'text-app-warning' },
                    { label: 'Expiring', val: expiringSoonCount, icon: Activity, color: 'text-app-success' }
                ].map((stat, i) => (
                    <div key={i} className="bg-app-card border border-app-border p-5 rounded-md relative overflow-hidden group shadow-md">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-white/5 group-hover:bg-app-primary transition-colors"></div>
                        <stat.icon className="absolute -bottom-4 -right-4 h-20 w-20 text-white/[0.02] group-hover:scale-110 transition-transform" />
                        <p className="tactical-label mb-2">{stat.label}</p>
                        <p className={cn("text-3xl font-black tabular-nums leading-none tracking-tighter", stat.color)}>{stat.val}</p>
                    </div>
                ))}
            </motion.div>

            {/* Sensor Array (Filter Bar) */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="sticky top-14 md:top-16 z-30 bg-app-bg/95 backdrop-blur-md py-4">
                <div className="bg-app-card border border-app-border p-2 rounded-md flex flex-col lg:flex-row gap-3 shadow-md">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                        <input 
                            placeholder="QUERY VAULT..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full h-10 pl-12 pr-4 rounded-md bg-app-bg border border-app-border focus:ring-1 focus:ring-app-primary tactical-label tracking-widest placeholder:text-app-muted/30"
                        />
                    </div>
                    
                    <div className="flex gap-2 items-center px-1 overflow-x-auto scrollbar-hide">
                        <div className="flex bg-app-bg p-1 rounded-md border border-app-border shrink-0">
                            {CATEGORIES.slice(0, 5).map(c => (
                                <button 
                                    key={c} onClick={() => setFilterCategory(c === filterCategory ? 'All' : c)}
                                    className={cn(
                                        "whitespace-nowrap h-8 px-4 rounded-sm tactical-label transition-all",
                                        filterCategory === c ? "bg-app-primary text-white shadow-lg" : "text-app-muted hover:text-app-text"
                                    )}
                                >
                                    {c.slice(0, 4)}
                                </button>
                            ))}
                        </div>
                        <div className="w-px h-8 bg-app-border mx-1 shrink-0"></div>
                        <div className="flex bg-app-bg p-1 rounded-md border border-app-border shrink-0">
                            <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-sm transition-all", viewMode==='grid'?'bg-white/5 text-app-primary':'text-app-muted')}><LayoutGrid className="h-4 w-4" /></button>
                            <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-sm transition-all", viewMode==='list'?'bg-white/5 text-app-primary':'text-app-muted')}><ListIcon className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content Feed */}
            <div className="min-h-[500px]">
                {filteredIngredients.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 text-center border border-dashed border-app-border rounded-md bg-app-card/30">
                        <Package className="h-12 w-12 text-app-muted opacity-10 mx-auto mb-6" />
                        <p className="tactical-label">Sector_Manifest_Null</p>
                    </motion.div>
                ) : (
                    <div className="space-y-12">
                         {Object.entries(groupedIngredients).map(([groupName, groupItems]) => (
                            <div key={groupName} className="space-y-4">
                                <div className="flex items-center gap-4 px-2">
                                    <h3 className="font-black text-xs uppercase tracking-[0.4em] text-app-text">{groupName}</h3>
                                    <div className="h-px flex-1 bg-app-border"></div>
                                    <span className="tactical-label">{groupItems.length} UNITS</span>
                                </div>
                                
                                <div className={cn(
                                    "grid gap-4", 
                                    viewMode === 'grid' ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1"
                                )}>
                                    <AnimatePresence mode="popLayout">
                                        {groupItems.map(item => (
                                            <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <PantryItemCard 
                                                    item={item} 
                                                    onEdit={setEditingIngredient}
                                                    isSelected={selectedIds.has(item.id)}
                                                    isSelectionMode={isSelectionMode}
                                                    onToggleSelect={(id) => setSelectedIds(prev => {
                                                        const n = new Set(prev);
                                                        if (n.has(id)) n.delete(id); else n.add(id);
                                                        return n;
                                                    })}
                                                    onUpdate={updateIngredient}
                                                    viewMode={viewMode}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                         ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showAddModal && <AddIngredientModal onClose={() => setShowAddModal(false)} onSave={(n) => { addIngredient(n); setShowAddModal(false); }} />}
                {editingIngredient && <EditIngredientModal ingredient={editingIngredient} onClose={() => setEditingIngredient(null)} onSave={(u) => { updateIngredient(u); setEditingIngredient(null); }} />}
                {showBatchModal && <BatchUpdateModal count={selectedIds.size} onClose={() => setShowBatchModal(false)} onSave={() => {}} />}
            </AnimatePresence>
        </motion.div>
    );
}
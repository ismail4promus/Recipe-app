import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Button, Chip, IconButton } from '../components/ui/kit';

const CATEGORIES = ["Protein", "Vegetable", "Fruit", "Grains", "Dairy", "Spices", "Oils & Fats", "Baking", "Condiments", "Beverage", "Other"];

export default function PantryPage() {
    const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useData();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || "");
    const [filterCategory, setFilterCategory] = useState("All");
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'expiring'>(() => {
        const f = searchParams.get('filter');
        return f === 'low' || f === 'expiring' ? f : 'all';
    });
    
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [groupByCategory, setGroupByCategory] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'stock' | 'cost'>('stock');

    const [showAddModal, setShowAddModal] = useState(() => searchParams.get('add') === '1');
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

    // Consume deep-link params once.
    useEffect(() => {
        if (searchParams.has('q') || searchParams.has('filter') || searchParams.has('add')) {
            setSearchParams({}, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isExpiringSoon = useCallback((i: Ingredient) => {
        if (!i.last_verified) return false;
        const expiry = new Date(i.last_verified);
        expiry.setDate(expiry.getDate() + (i.shelf_life_days || 365));
        const diff = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return diff <= 7;
    }, []);

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
            const matchesStock =
                stockFilter === 'all' ||
                (stockFilter === 'low' && item.packagesInStock <= 2) ||
                (stockFilter === 'expiring' && isExpiringSoon(item));
            return matchesSearch && matchesCategory && matchesStock;
        });

        return items.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'stock') return a.packagesInStock - b.packagesInStock;
            if (sortBy === 'cost') return b.costPerUnit - a.costPerUnit;
            return 0;
        });
    }, [ingredients, searchQuery, filterCategory, sortBy, stockFilter, isExpiringSoon]);

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
        if (window.confirm(`Delete ${selectedIds.size} selected items?`)) {
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
            {/* Header */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-app-border pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Warehouse className="h-6 w-6 text-app-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-app-text">Inventory</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-app-success"></span>
                        <span className="text-xs text-app-muted font-medium">Inventory healthy</span>
                    </div>
                </div>

                <Button icon={PlusCircle} onClick={() => setShowAddModal(true)}>
                    Add Inventory Item
                </Button>
            </motion.div>

            {/* Stat tiles */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Value', val: formatCurrency(totalValue).split('.')[0], icon: BarChart3, color: 'text-app-text' },
                    { label: 'Total Items', val: ingredients.length, icon: Boxes, color: 'text-app-primary' },
                    { label: 'Low Stock', val: lowStockCount, icon: ShieldAlert, color: 'text-app-warning' },
                    { label: 'Expiring Soon', val: expiringSoonCount, icon: Activity, color: 'text-app-success' }
                ].map((stat, i) => (
                    <div key={i} className="bg-app-card border border-app-border p-5 rounded-xl relative overflow-hidden group shadow-soft">
                        <stat.icon className="absolute -bottom-4 -right-4 h-20 w-20 text-app-muted/10 group-hover:scale-110 transition-transform" />
                        <p className="text-xs text-app-muted font-medium mb-2">{stat.label}</p>
                        <p className={cn("text-3xl font-bold tabular-nums leading-none tracking-tight", stat.color)}>{stat.val}</p>
                    </div>
                ))}
            </motion.div>

            {/* Filter bar */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="sticky top-14 md:top-16 z-30 bg-app-bg/95 backdrop-blur-md py-4">
                <div className="bg-app-card border border-app-border p-3 rounded-2xl flex flex-col lg:flex-row gap-3 shadow-soft">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                        <input
                            placeholder="Search inventory…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full min-h-[44px] pl-12 pr-4 rounded-full bg-app-elevated border border-app-border text-sm text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 placeholder:text-app-muted"
                        />
                    </div>

                    <div className="flex gap-2 items-center px-1 overflow-x-auto scrollbar-hide">
                        {stockFilter !== 'all' && (
                            <button
                                onClick={() => setStockFilter('all')}
                                className="flex items-center gap-2 whitespace-nowrap rounded-full border border-app-warning/30 bg-app-warning/15 px-4 min-h-[40px] text-sm font-medium text-app-warning shrink-0"
                            >
                                {stockFilter === 'low' ? 'Low stock' : 'Expiring soon'}
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {CATEGORIES.slice(0, 5).map(c => (
                            <Chip
                                key={c}
                                active={filterCategory === c}
                                onClick={() => setFilterCategory(c === filterCategory ? 'All' : c)}
                                className="shrink-0"
                            >
                                {c}
                            </Chip>
                        ))}
                        <div className="w-px h-8 bg-app-border mx-1 shrink-0"></div>
                        <div className="flex gap-1 bg-app-elevated p-1 rounded-full shrink-0">
                            <button onClick={() => setViewMode('grid')} aria-label="Grid view" aria-pressed={viewMode==='grid'} className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-all", viewMode==='grid'?'bg-app-primary text-primary-foreground':'text-app-muted hover:text-app-text')}><LayoutGrid className="h-4 w-4" /></button>
                            <button onClick={() => setViewMode('list')} aria-label="List view" aria-pressed={viewMode==='list'} className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-all", viewMode==='list'?'bg-app-primary text-primary-foreground':'text-app-muted hover:text-app-text')}><ListIcon className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content Feed */}
            <div className="min-h-[500px]">
                {filteredIngredients.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 text-center border border-dashed border-app-border rounded-2xl bg-app-card/30">
                        <Package className="h-12 w-12 text-app-muted opacity-30 mx-auto mb-6" />
                        <p className="text-sm text-app-muted font-medium">No items found</p>
                    </motion.div>
                ) : (
                    <div className="space-y-12">
                         {Object.entries(groupedIngredients).map(([groupName, groupItems]) => (
                            <div key={groupName} className="space-y-4">
                                <div className="flex items-center gap-4 px-2">
                                    <h3 className="font-bold text-sm tracking-tight text-app-text">{groupName}</h3>
                                    <div className="h-px flex-1 bg-app-border"></div>
                                    <span className="text-xs text-app-muted font-medium">{groupItems.length} items</span>
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
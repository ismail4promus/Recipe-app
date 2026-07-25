import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    Search, PlusCircle, Layers, X, LayoutGrid,
    List as ListIcon, Trash2, Boxes, Activity, Warehouse,
    ShieldAlert, BarChart3, Package, MoreVertical, Upload, Download,
    FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';
import { formatCurrency, cn, ANIMATION_VARIANTS } from '../lib/utils';
import { exportIngredients, parseImportedIngredients, downloadIngredientTemplate } from '../lib/ingredientIO';
import { AnimatePresence, motion } from 'framer-motion';
import { Ingredient } from '../types';
import { BatchUpdateModal } from '../components/pantry/BatchUpdateModal';
import { AddIngredientModal } from '../components/pantry/AddIngredientModal';
import { EditIngredientModal } from '../components/pantry/EditIngredientModal';
import { PantryItemCard } from '../components/pantry/PantryItemCard';
import { Button, Chip, IconButton } from '../components/ui/kit';
import { StickyToolbar } from '../components/ui/StickyToolbar';

const CATEGORIES = ["Protein", "Vegetable", "Fruit", "Grains", "Dairy", "Spices", "Oils & Fats", "Baking", "Condiments", "Beverage", "Other"];

export default function PantryPage() {
    const { ingredients, addIngredient, updateIngredient, deleteIngredient, batchAddIngredients } = useData();
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

    const [menuOpen, setMenuOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importReport, setImportReport] = useState<{ ok: boolean; title: string; details: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // --- Import / export ---
    const handleExport = useCallback(() => {
        setMenuOpen(false);
        // Export the current selection when there is one, otherwise everything.
        const subset = selectedIds.size > 0
            ? ingredients.filter(i => selectedIds.has(i.id))
            : ingredients;
        if (subset.length === 0) {
            setImportReport({ ok: false, title: 'Nothing to export', details: ['Your inventory is empty.'] });
            return;
        }
        exportIngredients(subset);
        setImportReport({
            ok: true,
            title: `Exported ${subset.length} item${subset.length === 1 ? '' : 's'}`,
            details: ['Edit the file in Excel or Sheets and import it back to update these items.'],
        });
    }, [ingredients, selectedIds]);

    const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-importing the same file
        if (!file) return;

        setImporting(true);
        setImportReport(null);
        try {
            const text = await file.text();
            const { items, created, updated, warnings } = parseImportedIngredients(text, ingredients);

            if (updated > 0) {
                const proceed = window.confirm(
                    `${items.length} row(s) read.\n\n` +
                    `${created} new item(s) will be added.\n` +
                    `${updated} existing item(s) will be overwritten with the values in the file.\n\n` +
                    `Continue?`
                );
                if (!proceed) {
                    setImportReport({ ok: false, title: 'Import cancelled', details: ['Nothing was changed.'] });
                    return;
                }
            }

            await batchAddIngredients(items);
            setImportReport({
                ok: true,
                title: `Imported ${items.length} item${items.length === 1 ? '' : 's'}`,
                details: [
                    `${created} added, ${updated} updated.`,
                    ...warnings.slice(0, 5),
                    ...(warnings.length > 5 ? [`…and ${warnings.length - 5} more warnings.`] : []),
                ],
            });
        } catch (err) {
            setImportReport({
                ok: false,
                title: 'Import failed',
                details: [err instanceof Error ? err.message : 'Unknown error.'],
            });
        } finally {
            setImporting(false);
        }
    }, [ingredients, batchAddIngredients]);

    return (
        <motion.div 
            initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container}
            className="space-y-2.5 md:space-y-3 max-w-7xl mx-auto pb-nav md:pb-10 px-1 md:px-0"
        >
            {/* Header */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-2.5 border-b border-app-border pb-4 md:pb-3">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <Warehouse className="h-5 w-5 md:h-6 md:w-6 text-app-primary" />
                        <h1 className="text-xl md:text-xl font-bold tracking-tight text-app-text">Inventory</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-app-success"></span>
                        <span className="text-xs text-app-muted font-medium">Inventory healthy</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="text/csv,.csv"
                        onChange={handleImportFile}
                        className="hidden"
                    />
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            aria-label="Import or export inventory"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            title="Import / export"
                            disabled={importing}
                            className="inline-flex h-10 w-10 items-center justify-center border border-app-border bg-app-elevated text-app-muted shadow-soft transition-all hover:text-app-text hover:border-app-primary/40 active:scale-[0.98] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                        >
                            {importing ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <MoreVertical className="h-[18px] w-[18px]" />}
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                <div role="menu" className="absolute right-0 top-11 z-50 w-52 border border-app-border bg-app-card py-1 shadow-card">
                                    <button
                                        role="menuitem"
                                        onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }}
                                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-elevated"
                                    >
                                        <Upload className="h-4 w-4 text-app-muted" /> Import (CSV)
                                    </button>
                                    <button
                                        role="menuitem"
                                        onClick={handleExport}
                                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-elevated"
                                    >
                                        <Download className="h-4 w-4 text-app-muted" /> Export {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'all'}
                                    </button>
                                    <button
                                        role="menuitem"
                                        onClick={() => { setMenuOpen(false); downloadIngredientTemplate(); }}
                                        className="flex w-full items-center gap-2.5 border-t border-app-border px-3 py-2 text-sm font-medium text-app-muted transition-colors hover:bg-app-elevated hover:text-app-text"
                                    >
                                        <FileSpreadsheet className="h-4 w-4" /> Download template
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <Button icon={PlusCircle} onClick={() => setShowAddModal(true)}>
                        Add Inventory Item
                    </Button>
                </div>
            </motion.div>

            {/* Import report */}
            <AnimatePresence>
                {importReport && (
                    <motion.div
                        variants={ANIMATION_VARIANTS.item}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={cn(
                            "border p-3 md:p-2.5 flex items-start gap-3",
                            importReport.ok
                                ? "border-app-success/30 bg-app-success/10"
                                : "border-app-danger/30 bg-app-danger/10"
                        )}
                    >
                        {importReport.ok
                            ? <CheckCircle2 className="h-5 w-5 shrink-0 text-app-success mt-0.5" />
                            : <AlertTriangle className="h-5 w-5 shrink-0 text-app-danger mt-0.5" />}
                        <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-semibold text-app-text">{importReport.title}</p>
                            {importReport.details.map((d, i) => (
                                <p key={i} className="text-xs text-app-muted leading-relaxed">{d}</p>
                            ))}
                        </div>
                        <button aria-label="Dismiss" onClick={() => setImportReport(null)} className="text-app-muted hover:text-app-text shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stat tiles */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-2.5">
                {[
                    { label: 'Total Value', val: formatCurrency(totalValue).split('.')[0], icon: BarChart3, color: 'text-app-text' },
                    { label: 'Total Items', val: ingredients.length, icon: Boxes, color: 'text-app-primary' },
                    { label: 'Low Stock', val: lowStockCount, icon: ShieldAlert, color: 'text-app-warning' },
                    { label: 'Expiring Soon', val: expiringSoonCount, icon: Activity, color: 'text-app-success' }
                ].map((stat, i) => (
                    <div key={i} className="bg-app-card border border-app-border px-2.5 py-2 flex items-center gap-2.5 shadow-soft transition-colors hover:border-app-primary/40">
                        <span className="h-8 w-8 shrink-0 flex items-center justify-center bg-app-muted/10">
                            <stat.icon className={cn("h-4 w-4", stat.color)} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[11px] text-app-muted font-medium leading-tight truncate">{stat.label}</p>
                            <p className={cn("text-lg font-bold tabular-nums leading-tight tracking-tight", stat.color)}>{stat.val}</p>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Filter bar */}
            <StickyToolbar innerClassName="flex flex-col lg:flex-row lg:items-center gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                        <input
                            placeholder="Search inventory…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 bg-app-elevated border border-app-border text-sm text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 placeholder:text-app-muted"
                        />
                    </div>

                    <div className="flex gap-2 items-center px-1 overflow-x-auto scrollbar-hide">
                        {stockFilter !== 'all' && (
                            <button
                                onClick={() => setStockFilter('all')}
                                className="flex items-center gap-2 whitespace-nowrap rounded-md border border-app-warning/30 bg-app-warning/15 px-4 min-h-[40px] text-sm font-medium text-app-warning shrink-0"
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
                        <div className="flex gap-1 bg-app-elevated p-1 rounded-md shrink-0">
                            <button onClick={() => setViewMode('grid')} aria-label="Grid view" aria-pressed={viewMode==='grid'} className={cn("flex h-9 w-9 items-center justify-center rounded-md transition-all", viewMode==='grid'?'bg-app-primary text-primary-foreground':'text-app-muted hover:text-app-text')}><LayoutGrid className="h-4 w-4" /></button>
                            <button onClick={() => setViewMode('list')} aria-label="List view" aria-pressed={viewMode==='list'} className={cn("flex h-9 w-9 items-center justify-center rounded-md transition-all", viewMode==='list'?'bg-app-primary text-primary-foreground':'text-app-muted hover:text-app-text')}><ListIcon className="h-4 w-4" /></button>
                        </div>
                    </div>
            </StickyToolbar>

            {/* Content Feed */}
            <div className="min-h-[500px]">
                {filteredIngredients.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center border border-dashed border-app-border rounded-lg bg-app-card/30">
                        <Package className="h-12 w-12 text-app-muted opacity-30 mx-auto mb-3" />
                        <p className="text-sm text-app-muted font-medium">No items found</p>
                    </motion.div>
                ) : (
                    <div className="space-y-2.5">
                         {Object.entries(groupedIngredients).map(([groupName, groupItems]) => (
                            <div key={groupName} className="space-y-2.5">
                                <div className="flex items-center gap-2.5 px-2">
                                    <h3 className="font-bold text-sm tracking-tight text-app-text">{groupName}</h3>
                                    <div className="h-px flex-1 bg-app-border"></div>
                                    <span className="text-xs text-app-muted font-medium">{groupItems.length} items</span>
                                </div>
                                
                                <div className={cn(
                                    "grid gap-2.5", 
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
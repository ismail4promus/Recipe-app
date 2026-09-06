import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Recipe, CookingSession } from '../types';
import { 
    Clock, Flame, Utensils, ArrowLeft, Star,
    Edit, Printer, ChefHat, Package, Calculator, HeartPulse, ListOrdered,
    Minus, Plus, Play, History, FastForward, X, Save as SaveIcon, Trash2, CheckCircle2, Timer,
    Check, Crosshair, Shield, Activity, AlertTriangle, Search, Download
} from 'lucide-react';
import { exportRecipe } from '../lib/recipeIO';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { NutritionTab } from '../components/recipes/NutritionTab';
import { PrintRecipeModal } from '../components/recipes/PrintRecipeModal';
import { IngredientsTab } from '../components/recipes/IngredientsTab';
import { StepsTab } from '../components/recipes/StepsTab';
import { CostTab } from '../components/recipes/CostTab';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

export default function RecipeDetailPage() {
    const { recipeId } = useParams<{ recipeId: string }>();
    const navigate = useNavigate();
    const { getRecipeById, updateRecipe, deleteRecipe, addRecipe, ingredients: pantryIngredients, updateIngredient, cookingSessions, loading } = useData();
    const confirm = useConfirm();
    const toast = useToast();

    const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'cost' | 'nutrition'>('ingredients');
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [localServings, setLocalServings] = useState<number | null>(null);
    
    const recipe = useMemo(() => getRecipeById(recipeId || ''), [recipeId, getRecipeById, loading]);
    
    const activeSessionsCount = useMemo(() => 
        cookingSessions.filter(s => s.recipeId === recipeId && s.status === 'in_progress').length,
    [cookingSessions, recipeId]);

    useEffect(() => {
        setLocalServings(null);
    }, [recipeId]);

    // --- Loading State Handler ---
    if (loading) {
        return (
            <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 border-4 border-app-primary/10 circle"></div>
                    <div className="absolute inset-0 border-4 border-app-primary border-t-transparent circle animate-spin"></div>
                </div>
                <div className="text-center">
                    <p className="text-sm text-app-muted font-medium animate-pulse">Loading recipe…</p>
                </div>
            </div>
        );
    }

    // --- Error State Handler (Recipe Not Found) ---
    if (!recipe) {
        return (
            <div className="flex flex-col h-[70vh] items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-app-card border border-app-border p-10 rounded-lg text-center relative overflow-hidden shadow-soft"
                >
                    <div className="h-16 w-16 bg-app-danger/10 text-app-danger rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-bold text-app-text tracking-tight mb-2">Recipe not found</h2>
                    <p className="text-sm text-app-muted mb-8 leading-relaxed">
                        We couldn't find the recipe you were looking for.
                    </p>
                    <button
                        onClick={() => navigate('/recipes')}
                        className="w-full min-h-[44px] bg-app-primary text-primary-foreground rounded-full font-semibold text-sm shadow-soft hover:brightness-105 active:scale-[0.97] transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Recipes
                    </button>
                </motion.div>
            </div>
        );
    }

    const currentServings = localServings ?? recipe.servings ?? 1;
    const scaleFactor = currentServings / (recipe.servings || 1);

    const handleDelete = async () => {
        const ok = await confirm({
            title: `Delete "${recipe.name}"?`,
            message: 'The recipe and its steps are removed from the kitchen.',
            details: activeSessionsCount > 0
                ? [`${activeSessionsCount} cooking session${activeSessionsCount === 1 ? '' : 's'} in progress will be left without a recipe.`]
                : undefined,
            confirmLabel: 'Delete recipe',
            destructive: true,
        });
        if (!ok) return;

        const deleted = await deleteRecipe(recipe.id);
        if (!deleted) return;   // the save banner explains why

        navigate('/recipes');
        // The whole record is still in memory, so an accidental delete costs a tap.
        toast.toast({
            title: `Deleted "${recipe.name}"`,
            tone: 'success',
            duration: 10000,
            action: {
                label: 'Undo',
                onClick: async () => {
                    const restored = await addRecipe(recipe);
                    if (restored) toast.success('Recipe restored');
                },
            },
        });
    };

    return (
        // Negative margins mirror Layout's own padding exactly (p-2 md:p-3 lg:p-4)
        // so the hero is full-bleed without spilling past the viewport edge.
        <div className="min-h-screen pb-nav md:pb-10 -mt-2 md:-mt-3 lg:-mt-4 -mx-2 md:-mx-3 lg:-mx-4 font-sans bg-app-bg relative">
            {showPrintModal && <PrintRecipeModal recipe={recipe} onClose={() => setShowPrintModal(false)} />}
            
            {/* HERO SECTION */}
            <div className="relative h-[26vh] min-h-[180px] md:h-[30vh] md:max-h-[300px] w-full overflow-hidden bg-app-card border-b border-app-border shadow-soft">
                <img src={recipe.imageUrl} className="w-full h-full object-cover" alt={recipe.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/40 to-transparent" />

                {/* Only navigation sits on the image — the tools live in the bar below,
                    where they have room to wrap on a phone. */}
                <div className="absolute top-2.5 left-2.5 right-2.5 md:top-3 md:left-4 md:right-4 flex justify-between items-start gap-2 z-20">
                    <button aria-label="Back to recipes" onClick={() => navigate('/recipes')} className="h-9 w-9 flex items-center justify-center bg-app-card rounded-xl border border-app-border text-app-text hover:text-app-primary transition-all active:scale-90 shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                        <ArrowLeft className="h-4 w-4" />
                    </button>

                    <button
                        onClick={() => navigate(`/recipes/${recipeId}/logs?servings=${currentServings}`)}
                        className="h-9 px-4 rounded-full bg-app-primary text-primary-foreground font-semibold text-sm shadow-card hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                    >
                        <ChefHat className="h-4 w-4" /> Cook
                    </button>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 md:bottom-4 md:left-6 md:right-6 max-w-7xl mx-auto">
                    <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="h-1.5 w-1.5 bg-app-success"></span>
                            <span className="text-[11px] md:text-xs font-medium text-app-muted truncate">{recipe.category} · {recipe.cuisine}</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-app-text leading-tight tracking-tight mb-1 line-clamp-2">{recipe.name}</h1>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                            <span className="flex items-center gap-1.5 text-[11px] md:text-xs font-medium text-app-primary">
                                <Clock className="h-3.5 w-3.5 shrink-0" /> {recipe.prepTime + recipe.cookTime} min
                            </span>
                            <span className="h-3 w-px bg-app-border"></span>
                            <span className="flex items-center gap-1.5 text-[11px] md:text-xs font-medium text-app-warning">
                                <Activity className="h-3.5 w-3.5 shrink-0" /> {recipe.difficulty}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ACTION BAR — servings on the left, tools on the right; stacks on phones */}
            <div className="max-w-7xl mx-auto px-2 md:px-6 pt-2">
                <div className="flex items-center gap-1.5 bg-app-card rounded-xl border border-app-border p-1.5 shadow-soft">
                    <div className="flex items-center rounded-xl border border-app-border bg-app-elevated h-8 shrink-0">
                        <button aria-label="Decrease servings" onClick={() => setLocalServings(Math.max(1, currentServings - 1))} className="w-8 h-8 flex items-center justify-center text-app-muted hover:text-app-primary hover:bg-app-muted/10 font-semibold transition-all">−</button>
                        <div className="px-1 text-center w-11 border-x border-app-border">
                            <input
                                type="number"
                                aria-label="Servings"
                                value={currentServings}
                                onChange={(e) => setLocalServings(Math.max(1, parseInt(e.target.value) || 1))}
                                className="block w-full bg-transparent text-center font-semibold text-sm text-app-text tabular-nums outline-none appearance-none"
                            />
                        </div>
                        <button aria-label="Increase servings" onClick={() => setLocalServings(currentServings + 1)} className="w-8 h-8 flex items-center justify-center text-app-muted hover:text-app-primary hover:bg-app-muted/10 font-semibold transition-all">+</button>
                    </div>
                    <span className="text-[11px] font-medium text-app-muted hidden sm:inline">servings</span>

                    <div className="ml-auto flex items-center">
                        <button aria-label="Print recipe" title="Print" onClick={() => setShowPrintModal(true)} className="h-8 w-8 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-muted/10 border border-transparent hover:border-app-border transition-all">
                            <Printer className="h-4 w-4" />
                        </button>

                        <button aria-label="Export recipe" title="Export recipe (CSV)" onClick={() => exportRecipe(recipe)} className="h-8 w-8 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-muted/10 border border-transparent hover:border-app-border transition-all">
                            <Download className="h-4 w-4" />
                        </button>

                        <button
                            aria-label="Edit recipe"
                            title="Edit"
                            onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                            className="h-8 w-8 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-muted/10 border border-transparent hover:border-app-border transition-all"
                        >
                            <Edit className="h-4 w-4" />
                        </button>

                        <button
                            aria-label="Delete recipe"
                            title="Delete recipe"
                            onClick={handleDelete}
                            className="h-8 w-8 flex items-center justify-center text-app-muted hover:text-app-danger hover:bg-app-danger/10 border border-transparent hover:border-app-danger/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-danger/60"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="max-w-7xl mx-auto px-2 md:px-6 pt-1.5 relative z-10">
                {/* Macros — label and figure on one line so the strip stays one row tall */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-2">
                    {[
                        { label: 'Calories', val: Math.round((recipe.nutrition?.calories || 0) * scaleFactor), color: 'text-app-warning' },
                        { label: 'Protein', val: Math.round((recipe.nutrition?.protein || 0) * scaleFactor) + 'g', color: 'text-app-primary' },
                        { label: 'Carbs', val: Math.round((recipe.nutrition?.carbs || 0) * scaleFactor) + 'g', color: 'text-app-success' },
                        { label: 'Fat', val: Math.round((recipe.nutrition?.fat || 0) * scaleFactor) + 'g', color: 'text-app-text' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-app-card rounded-xl border border-app-border px-2.5 py-1.5 flex items-baseline justify-between gap-2 transition-colors shadow-soft hover:border-app-primary/40">
                            <p className="text-[10px] font-semibold text-app-muted uppercase tracking-wider">{stat.label}</p>
                            <p className={cn("text-base font-bold tabular-nums leading-none", stat.color)}>{stat.val}</p>
                        </div>
                    ))}
                </div>

                {/* TABS — thin underline indicator, pinned under the header while scrolling */}
                <div className="sticky top-14 z-20 -mx-2 md:-mx-6 px-2 md:px-6 bg-app-bg/95 backdrop-blur-sm flex border-b border-app-border mb-2 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'ingredients', label: 'Ingredients', icon: ListOrdered },
                        { id: 'steps', label: 'Method', icon: Utensils },
                        { id: 'cost', label: 'Cost', icon: Calculator },
                        { id: 'nutrition', label: 'Nutrition', icon: HeartPulse }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "relative flex-1 md:flex-none flex items-center justify-center gap-1.5 whitespace-nowrap px-2 md:px-3.5 py-2 text-xs md:text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60",
                                activeTab === tab.id ? "text-app-primary" : "text-app-muted hover:text-app-text"
                            )}
                        >
                            <tab.icon className="h-3.5 w-3.5 shrink-0" /> {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="tab-indicator" className="absolute -bottom-px left-0 right-0 h-[2px] bg-app-primary" />
                            )}
                        </button>
                    ))}
                </div>

                {/* SECTION VIEWER */}
                <div className="min-h-[220px] bg-app-card rounded-xl border border-app-border p-1.5 md:p-2.5 relative overflow-hidden shadow-soft">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                            {activeTab === 'ingredients' && <IngredientsTab recipe={recipe} scaleFactor={scaleFactor} pantryIngredients={pantryIngredients} onUpdatePantryItem={updateIngredient} onUpdateRecipe={updateRecipe} />}
                            {activeTab === 'steps' && <StepsTab steps={recipe.steps} />}
                            {activeTab === 'cost' && <CostTab recipe={recipe} scaleFactor={scaleFactor} pantryIngredients={pantryIngredients} />}
                            {activeTab === 'nutrition' && <NutritionTab recipe={recipe} scaleFactor={scaleFactor} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

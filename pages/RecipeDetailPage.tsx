import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Recipe, CookingSession } from '../types';
import { 
    Clock, Flame, Utensils, ArrowLeft, Star, 
    Edit, Printer, ChefHat, Package, Calculator, HeartPulse, ListOrdered, 
    Minus, Plus, Play, History, FastForward, X, Save as SaveIcon, Trash2, CheckCircle2, Timer,
    Check, Crosshair, Shield, Activity, AlertTriangle, Search
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { NutritionTab } from '../components/recipes/NutritionTab';
import { PrintRecipeModal } from '../components/recipes/PrintRecipeModal';
import { IngredientsTab } from '../components/recipes/IngredientsTab';
import { StepsTab } from '../components/recipes/StepsTab';
import { CostTab } from '../components/recipes/CostTab';

export default function RecipeDetailPage() {
    const { recipeId } = useParams<{ recipeId: string }>();
    const navigate = useNavigate();
    const { getRecipeById, updateRecipe, ingredients: pantryIngredients, updateIngredient, cookingSessions, loading } = useData();

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
            <div className="flex flex-col h-[70vh] items-center justify-center gap-6">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 border-4 border-app-primary/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
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
                    className="max-w-md w-full bg-app-card border border-app-border p-10 rounded-2xl text-center relative overflow-hidden shadow-soft"
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

    return (
        <div className="min-h-screen pb-20 -mt-2 -mx-2 md:-mx-6 lg:-mx-8 font-sans bg-app-bg relative">
            {showPrintModal && <PrintRecipeModal recipe={recipe} onClose={() => setShowPrintModal(false)} />}
            
            {/* HERO SECTION */}
            <div className="relative h-[25vh] md:h-[40vh] w-full overflow-hidden bg-app-card border-b border-app-border shadow-soft">
                <img src={recipe.imageUrl} className="w-full h-full object-cover" alt={recipe.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/30 to-transparent" />

                {/* NAVIGATION OVERLAY */}
                <div className="absolute top-4 left-6 right-6 flex justify-between items-start z-20">
                    <button aria-label="Back to recipes" onClick={() => navigate('/recipes')} className="h-11 w-11 flex items-center justify-center bg-app-card border border-app-border rounded-full text-app-text hover:text-app-primary transition-all active:scale-90 shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2 p-1 bg-app-card border border-app-border rounded-full shadow-soft">
                        <div className="flex items-center bg-app-elevated rounded-full px-2 h-9 border border-app-border">
                             <button aria-label="Decrease servings" onClick={() => setLocalServings(Math.max(1, currentServings - 1))} className="w-8 h-8 flex items-center justify-center text-app-muted hover:text-app-primary font-semibold transition-all">-</button>
                             <div className="px-3 text-center min-w-[40px]">
                                <input
                                    type="number"
                                    aria-label="Servings"
                                    value={currentServings}
                                    onChange={(e) => setLocalServings(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="block w-full bg-transparent text-center font-semibold text-sm text-app-text tabular-nums outline-none appearance-none"
                                />
                             </div>
                             <button aria-label="Increase servings" onClick={() => setLocalServings(currentServings + 1)} className="w-8 h-8 flex items-center justify-center text-app-muted hover:text-app-primary font-semibold transition-all">+</button>
                        </div>

                        <div className="h-6 w-px bg-app-border mx-1"></div>

                        <button aria-label="Print recipe" onClick={() => setShowPrintModal(true)} className="h-9 w-9 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-muted/10 rounded-full transition-all">
                            <Printer className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => navigate(`/recipes/${recipeId}/logs?servings=${currentServings}`)}
                            className="h-9 px-4 bg-app-primary text-primary-foreground rounded-full font-semibold text-sm shadow-soft hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                        >
                            <ChefHat className="h-4 w-4" />
                            <span className="hidden xs:inline">Cook</span>
                        </button>

                        <button
                            aria-label="Edit recipe"
                            onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                            className="h-9 w-9 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-muted/10 rounded-full transition-all"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8 max-w-7xl mx-auto">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="h-2 w-2 rounded-full bg-app-success"></span>
                            <span className="text-sm font-medium text-app-muted">{recipe.category} · {recipe.cuisine}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-app-text leading-tight tracking-tight mb-3">{recipe.name}</h1>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-app-primary">
                                <Clock className="h-4 w-4" /> Cooking Time: {recipe.prepTime + recipe.cookTime}m
                            </div>
                            <div className="h-4 w-px bg-app-border"></div>
                            <div className="flex items-center gap-2 text-sm font-medium text-app-warning">
                                <Activity className="h-4 w-4" /> Difficulty: {recipe.difficulty}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-6 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Calories', val: Math.round((recipe.nutrition?.calories || 0) * scaleFactor), color: 'text-app-warning' },
                        { label: 'Protein', val: Math.round((recipe.nutrition?.protein || 0) * scaleFactor) + 'g', color: 'text-app-primary' },
                        { label: 'Carbs', val: Math.round((recipe.nutrition?.carbs || 0) * scaleFactor) + 'g', color: 'text-app-success' },
                        { label: 'Fat', val: Math.round((recipe.nutrition?.fat || 0) * scaleFactor) + 'g', color: 'text-app-text' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-app-card border border-app-border p-5 rounded-2xl flex flex-col items-center justify-center transition-all shadow-soft relative overflow-hidden group hover:border-app-primary/30">
                            <p className="text-xs font-medium text-app-muted mb-2 text-center">{stat.label}</p>
                            <p className={cn("text-2xl font-bold tabular-nums leading-none", stat.color)}>{stat.val}</p>
                        </div>
                    ))}
                </div>

                {/* TAB SWITCHBOARD */}
                <div className="flex border border-app-border bg-app-card rounded-full mb-8 overflow-x-auto scrollbar-hide shadow-soft p-1">
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
                                "flex-1 min-w-[100px] py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60",
                                activeTab === tab.id
                                    ? "text-primary-foreground"
                                    : "text-app-muted hover:text-app-text"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-app-primary rounded-full -z-10" />
                            )}
                            <tab.icon className="h-4 w-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* SECTION VIEWER */}
                <div className="min-h-[500px] bg-app-card border border-app-border rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-soft">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
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

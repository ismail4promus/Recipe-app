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
                    <div className="absolute inset-0 border-4 border-app-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#10b981]"></div>
                </div>
                <div className="text-center">
                    <p className="tactical-label animate-pulse">Scanning Archive...</p>
                    <p className="text-[8px] font-black text-app-muted uppercase tracking-[0.4em] mt-2">Retrieving Module ID: {recipeId?.toUpperCase()}</p>
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
                    className="max-w-md w-full bg-app-card border border-dashed border-app-danger/30 p-10 rounded-sm text-center relative overflow-hidden"
                >
                    <div className="absolute -top-4 -right-4 h-24 w-24 text-app-danger/5">
                        <AlertTriangle className="h-full w-full" />
                    </div>
                    <div className="h-16 w-16 bg-app-danger/10 text-app-danger rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-black text-app-text uppercase tracking-tighter mb-2 leading-none">Archive Link Severed</h2>
                    <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.2em] mb-8 leading-relaxed">
                        Module ID <span className="text-app-danger">{recipeId}</span> was not detected in the operational registry.
                    </p>
                    <button 
                        onClick={() => navigate('/recipes')}
                        className="w-full h-12 bg-app-primary text-white rounded-sm font-black text-[10px] uppercase tracking-[0.3em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <ArrowLeft className="h-4 w-4" /> Return to Archive
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
            
            {/* HERO SECTION - Tactical Header */}
            <div className="relative h-[25vh] md:h-[40vh] w-full overflow-hidden bg-app-card border-b border-app-border shadow-2xl">
                <img src={recipe.imageUrl} className="w-full h-full object-cover opacity-40 grayscale-[0.5]" alt={recipe.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/20 to-transparent" />
                
                {/* NAVIGATION OVERLAY */}
                <div className="absolute top-4 left-6 right-6 flex justify-between items-start z-20">
                    <button onClick={() => navigate('/recipes')} className="h-10 w-10 flex items-center justify-center bg-app-bg border border-app-border rounded-sm text-app-text hover:text-app-primary transition-all active:scale-90 shadow-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2 p-1 bg-app-card border border-app-border rounded-sm shadow-2xl">
                        <div className="flex items-center bg-app-bg rounded-sm px-2 h-9 border border-white/5">
                             <button onClick={() => setLocalServings(Math.max(1, currentServings - 1))} className="w-8 h-8 flex items-center justify-center text-app-muted hover:text-app-primary font-black transition-all">-</button>
                             <div className="px-3 text-center min-w-[40px]">
                                <input 
                                    type="number" 
                                    value={currentServings} 
                                    onChange={(e) => setLocalServings(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="block w-full bg-transparent text-center font-black text-sm text-app-text tabular-nums outline-none appearance-none"
                                />
                             </div>
                             <button onClick={() => setLocalServings(currentServings + 1)} className="w-8 h-8 flex items-center justify-center text-app-muted hover:text-app-primary font-black transition-all">+</button>
                        </div>

                        <div className="h-6 w-px bg-app-border mx-1"></div>

                        <button onClick={() => setShowPrintModal(true)} className="h-9 w-9 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-white/5 rounded-sm transition-all">
                            <Printer className="h-4 w-4" />
                        </button>
                        
                        <button 
                            onClick={() => navigate(`/recipes/${recipeId}/logs?servings=${currentServings}`)}
                            className="h-9 px-4 bg-app-primary text-white rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <ChefHat className="h-4 w-4" />
                            <span className="hidden xs:inline">Service</span>
                        </button>

                        <button 
                            onClick={() => navigate(`/recipes/${recipe.id}/edit`)} 
                            className="h-9 w-9 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-white/5 rounded-sm transition-all"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8 max-w-7xl mx-auto">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="h-2 w-2 rounded-full bg-app-success animate-pulse shadow-[0_0_8px_#10b981]"></span>
                            <span className="text-[10px] font-black uppercase text-app-muted tracking-[0.3em]">Module: {recipe.category} // Sector: {recipe.cuisine}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-app-text leading-tight tracking-tighter uppercase mb-2 drop-shadow-lg">{recipe.name}</h1>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-app-primary tracking-widest">
                                <Clock className="h-3 w-3" /> Runtime: {recipe.prepTime + recipe.cookTime}m
                            </div>
                            <div className="h-4 w-px bg-app-border"></div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-app-warning tracking-widest">
                                <Activity className="h-3 w-3" /> Difficulty: {recipe.difficulty}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-6 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'CALORIC YIELD', val: Math.round((recipe.nutrition?.calories || 0) * scaleFactor), color: 'text-app-warning' },
                        { label: 'PROTEIN MASS', val: Math.round((recipe.nutrition?.protein || 0) * scaleFactor) + 'G', color: 'text-app-primary' },
                        { label: 'CARBOHYDRATE', val: Math.round((recipe.nutrition?.carbs || 0) * scaleFactor) + 'G', color: 'text-app-success' },
                        { label: 'LIPID CONTENT', val: Math.round((recipe.nutrition?.fat || 0) * scaleFactor) + 'G', color: 'text-app-text' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-app-card border border-app-border p-5 rounded-sm flex flex-col items-center justify-center transition-all shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-white/5 group-hover:bg-app-primary transition-colors"></div>
                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-app-muted mb-2 text-center">{stat.label}</p>
                            <p className={cn("text-2xl font-black tabular-nums leading-none", stat.color)}>{stat.val}</p>
                        </div>
                    ))}
                </div>

                {/* TACTICAL TAB SWITCHBOARD */}
                <div className="flex border border-app-border bg-app-card rounded-sm mb-8 overflow-x-auto scrollbar-hide shadow-xl">
                    {[
                        { id: 'ingredients', label: 'Prep', icon: ListOrdered },
                        { id: 'steps', label: 'Method', icon: Utensils },
                        { id: 'cost', label: 'Finance', icon: Calculator },
                        { id: 'nutrition', label: 'Vitality', icon: HeartPulse }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-1 min-w-[100px] py-5 px-6 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all relative border-r border-app-border last:border-r-0",
                                activeTab === tab.id 
                                    ? "bg-white/5 text-app-primary" 
                                    : "text-app-muted hover:text-app-text hover:bg-white/[0.02]"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-app-primary" />
                            )}
                            <tab.icon className="h-4 w-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* SECTION VIEWER */}
                <div className="min-h-[500px] bg-app-card border border-app-border rounded-sm p-8 relative overflow-hidden shadow-2xl">
                    <Crosshair className="absolute top-6 right-6 h-32 w-32 text-white/[0.02] pointer-events-none" />
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

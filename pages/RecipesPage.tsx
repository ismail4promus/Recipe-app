import React, { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Grid3X3, List, Plus, Star, Clock, Activity, 
  Search, Layers, Crosshair, Shield, Zap, Target,
  Filter, ArrowRight, Cpu, TrendingUp
} from "lucide-react";
import { useData } from "../context/DataContext";
import { Recipe, Ingredient } from "../types";
import { formatCurrency, cn, ANIMATION_VARIANTS } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  { v: "All", l: "ALL SECTORS" },
  { v: "Main Course", l: "MAINS" },
  { v: "Appetizer", l: "STARTS" },
  { v: "Dessert", l: "SWEETS" },
  { v: "Beverage", l: "DRINKS" }
];

const TacticalRecipeCard: React.FC<{ 
  recipe: Recipe; 
  viewMode: 'grid' | 'list';
  onToggleFavorite: (recipe: Recipe) => void;
  pantryIngredients: Ingredient[];
}> = React.memo(({ recipe, viewMode, onToggleFavorite, pantryIngredients }) => {
  const navigate = useNavigate();
  
  const { pricePerPerson, difficultyColor, difficultyGlow } = useMemo(() => {
    let rawTotal = 0;
    recipe.ingredientSections?.forEach(sec => {
      sec.ingredients?.forEach(ing => {
        const pantryItem = pantryIngredients.find(pi => pi.id === ing.ingredientId);
        const unitCost = ing.manualCostPerUnit !== undefined ? ing.manualCostPerUnit : (pantryItem?.costPerUnit || 0);
        rawTotal += (ing.quantity * unitCost);
      });
    });
    const overhead = rawTotal * (recipe.overheadPercentage / 100);
    const profit = rawTotal * (recipe.profitMargin / 100);
    const totalMenuPrice = rawTotal + overhead + profit;
    const servings = recipe.servings || 1;
    
    const diffMap: Record<string, {color: string, glow: string}> = {
      'Easy': { color: 'text-app-success', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.4)]' },
      'Medium': { color: 'text-app-warning', glow: 'shadow-[0_0_8px_rgba(250,204,21,0.4)]' },
      'Hard': { color: 'text-app-danger', glow: 'shadow-[0_0_8px_rgba(244,63,94,0.4)]' }
    };

    return {
      pricePerPerson: totalMenuPrice / servings,
      difficultyColor: diffMap[recipe.difficulty]?.color || 'text-app-muted',
      difficultyGlow: diffMap[recipe.difficulty]?.glow || ''
    };
  }, [recipe, pantryIngredients]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(recipe);
  };

  if (viewMode === 'list') {
    return (
      <motion.div 
        layout
        onClick={() => navigate(`/recipes/${recipe.id}`)}
        className="group flex flex-row items-center gap-4 p-3 bg-app-card/40 backdrop-blur-md border border-app-border rounded-sm hover:border-app-primary/40 hover:bg-white/[0.02] cursor-pointer transition-all active:scale-[0.99] relative overflow-hidden"
      >
        {recipe.isFavorite && <div className="absolute top-0 left-0 w-1 h-full bg-app-primary shadow-[0_0_12px_#10b981]" />}
        
        <div className="relative w-24 h-16 flex-shrink-0 rounded-sm overflow-hidden bg-app-bg border border-white/5 shadow-inner">
          <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-all duration-700" />
          <div className="absolute inset-0 bg-gradient-to-r from-app-bg/60 to-transparent" />
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-app-text text-sm truncate uppercase tracking-tight group-hover:text-app-primary transition-colors leading-none">{recipe.name}</h3>
            {recipe.isFavorite && <Star className="h-3 w-3 fill-app-warning text-app-warning shrink-0" />}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="tactical-label !text-[7px] px-1.5 py-0.5 bg-white/5 rounded-sm border border-white/5">{recipe.category}</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-2.5 w-2.5 text-app-muted" />
              <span className="text-[9px] font-black text-app-muted tabular-nums">{recipe.prepTime + recipe.cookTime}M</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10 shrink-0 px-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="tactical-label !text-[7px] mb-1">Audit_Status</span>
            <div className={cn("flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest", difficultyColor)}>
              <div className={cn("status-pulse bg-current", difficultyGlow)} /> {recipe.difficulty}
            </div>
          </div>
          <div className="text-right border-l border-white/5 pl-10 min-w-[100px]">
            <span className="tactical-label !text-[7px] mb-1">Yield_Cap</span>
            <div className="text-sm font-black text-app-primary tabular-nums tracking-tighter leading-none">{formatCurrency(pricePerPerson)}</div>
          </div>
          <ArrowRight className="h-4 w-4 text-app-muted group-hover:text-app-primary group-hover:translate-x-1 transition-all" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      className="group bg-app-card/40 backdrop-blur-md rounded-sm overflow-hidden cursor-pointer flex flex-col hover:border-app-primary/40 transition-all border border-app-border shadow-2xl relative border-t-2 border-t-white/5 hover:border-t-app-primary"
    >
      {/* Background HUD Graphics */}
      <Shield className="absolute -bottom-6 -right-6 h-24 w-24 text-white/[0.02] group-hover:scale-110 transition-transform pointer-events-none" />
      <div className="absolute top-2 left-2 z-20">
        <span className="tactical-label !text-[6px] !text-white bg-app-primary/80 backdrop-blur-md px-2 py-0.5 rounded-sm border border-white/10 shadow-lg">
          {recipe.cuisine}
        </span>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/5 bg-app-bg">
        <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-all grayscale-[0.5] group-hover:grayscale-0 duration-1000 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-app-card via-transparent to-transparent opacity-60" />
        
        {/* Rapid Actions */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-4px] group-hover:translate-y-0 duration-300">
           <button onClick={handleFavoriteClick} className="h-7 w-7 bg-app-bg/90 backdrop-blur-md rounded-sm text-app-text hover:text-app-primary transition-all border border-white/5 shadow-xl flex items-center justify-center">
               <Star className={cn("h-3.5 w-3.5 transition-all", recipe.isFavorite && "fill-app-warning text-app-warning scale-110")} />
          </button>
        </div>
        
        {/* Progress HUD bar */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5 overflow-hidden">
           <motion.div 
            initial={{ width: 0 }} 
            whileInView={{ width: '100%' }} 
            className="h-full bg-app-primary/30" 
           />
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow relative z-10 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-1 rounded-full bg-app-primary animate-pulse" />
            <span className="tactical-label !text-[7px] opacity-60">{recipe.category}</span>
          </div>
          <h3 className="font-black text-[13px] uppercase tracking-tight line-clamp-2 group-hover:text-app-primary transition-colors leading-snug h-8">{recipe.name}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-app-bg/40 p-2 rounded-sm border border-white/5 flex flex-col justify-center">
            <span className="tactical-label !text-[6px] mb-1">Execution_Time</span>
            <div className="flex items-center gap-2 text-[10px] font-black text-app-text tabular-nums">
              <Clock className="h-3 w-3 text-app-primary" /> {recipe.prepTime + recipe.cookTime}M
            </div>
          </div>
          <div className="bg-app-bg/40 p-2 rounded-sm border border-white/5 flex flex-col justify-center items-end text-right">
            <span className="tactical-label !text-[6px] mb-1">Load_Class</span>
            <div className={cn("flex items-center gap-2 text-[10px] font-black tabular-nums uppercase", difficultyColor)}>
              <Activity className="h-3 w-3" /> {recipe.difficulty}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="tactical-label !text-[6px] mb-1 opacity-50">Audit_Val_Per_Unit</span>
            <span className="text-sm font-black text-app-text tabular-nums leading-none tracking-tight">{formatCurrency(pricePerPerson)}</span>
          </div>
          <div className="h-9 w-9 rounded-sm bg-app-bg text-app-primary flex items-center justify-center border border-app-border group-hover:bg-app-primary group-hover:text-white transition-all shadow-lg active:scale-90">
            <Zap className="h-4 w-4 fill-current" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function RecipesPage() {
  const { recipes, updateRecipe, ingredients } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
  }, [recipes, searchQuery, selectedCategory]);

  const toggleFavorite = useCallback((recipe: Recipe) => {
    updateRecipe({ ...recipe, isFavorite: !recipe.isFavorite });
  }, [updateRecipe]);

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container}
      className="space-y-6 max-w-7xl mx-auto pb-24 px-4 md:px-0 font-sans"
    >
      {/* Command Strip */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-app-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-app-primary/10 rounded-sm flex items-center justify-center border border-app-primary/20">
              <Cpu className="h-6 w-6 text-app-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-app-text uppercase leading-none">Recipe Terminal</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="status-pulse bg-app-success shadow-[0_0_8px_#10b981]"></span>
                <span className="tactical-label !text-[8px]">Live Archive: {recipes.length} Modules Online</span>
              </div>
            </div>
          </div>
        </div>

        <Link to="/recipes/new" className="h-12 px-10 bg-app-primary text-white rounded-sm font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-4 shadow-2xl shadow-app-primary/20 hover:brightness-110 active:scale-95 transition-all">
          <Plus className="h-4 w-4 stroke-[3px]" /> Initialize Entry
        </Link>
      </motion.div>

      {/* Control HUD System */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="sticky top-14 md:top-16 z-30 py-2">
        <div className="bg-app-sidebar/70 backdrop-blur-xl border border-app-border p-2 rounded-sm flex flex-col lg:flex-row gap-3 shadow-2xl">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted/50" />
            <input 
              placeholder="QUERY ARCHIVE MODULES..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full h-11 pl-12 pr-4 rounded-sm bg-app-bg border border-app-border focus:ring-1 focus:ring-app-primary/40 tactical-label !text-[10px] tracking-widest placeholder:text-app-muted/20 focus:bg-app-bg/50 transition-all"
            />
          </div>
          
          <div className="flex gap-2 items-center px-1">
            <div className="flex items-center gap-1 bg-app-bg/40 p-1 rounded-sm border border-app-border overflow-x-auto scrollbar-hide">
              {categories.map(c => (
                <button 
                  key={c.v} 
                  onClick={() => setSelectedCategory(c.v)}
                  className={cn(
                    "whitespace-nowrap h-9 px-6 rounded-sm tactical-label !text-[8px] transition-all duration-300",
                    selectedCategory === c.v 
                      ? "bg-app-primary text-white shadow-lg shadow-app-primary/30" 
                      : "text-app-muted hover:text-app-text hover:bg-white/5"
                  )}
                >
                  {c.l}
                </button>
              ))}
            </div>
            
            <div className="h-8 w-px bg-white/5 mx-1 hidden lg:block" />
            
            <div className="flex bg-app-bg/40 p-1 rounded-sm border border-app-border shrink-0">
              <button 
                onClick={() => setViewMode("grid")} 
                className={cn("p-2.5 rounded-sm transition-all", viewMode==='grid'?'bg-white/10 text-app-primary shadow-inner':'text-app-muted/60 hover:text-app-text')}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")} 
                className={cn("p-2.5 rounded-sm transition-all", viewMode==='list'?'bg-white/10 text-app-primary shadow-inner':'text-app-muted/60 hover:text-app-text')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Module Grid Feed */}
      <div className={cn(
        "grid gap-5", 
        viewMode === 'grid' 
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
          : 'grid-cols-1'
      )}>
        <AnimatePresence mode="popLayout">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <motion.div 
                key={recipe.id} 
                layout 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <TacticalRecipeCard 
                  recipe={recipe} 
                  viewMode={viewMode} 
                  onToggleFavorite={toggleFavorite} 
                  pantryIngredients={ingredients} 
                />
              </motion.div>
            ))
          ) : (
            <motion.div 
              layout
              className="col-span-full flex flex-col items-center justify-center py-48 bg-app-card/10 border border-dashed border-app-border rounded-sm backdrop-blur-sm"
            >
              <div className="h-16 w-16 rounded-full border border-app-muted/20 flex items-center justify-center mb-6 opacity-40">
                <Shield className="h-8 w-8 text-app-muted" />
              </div>
              <p className="tactical-label opacity-40">Sector_Archive_Static: Null Data Detected</p>
              <button 
                onClick={() => {setSearchQuery(""); setSelectedCategory("All");}}
                className="mt-6 text-[9px] font-black text-app-primary uppercase tracking-[0.3em] hover:underline"
              >
                Reset System Query
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Analytics Insight HUD (Footer) */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-white/5">
        {[
          { label: "Archival_Volume", val: recipes.length, icon: Layers, color: "text-app-primary" },
          { label: "Fav_Priority_Idx", val: recipes.filter(r => r.isFavorite).length, icon: Star, color: "text-app-warning" },
          { label: "Archive_Integrity", val: "STABLE", icon: Shield, color: "text-app-success" }
        ].map(stat => (
          <div key={stat.label} className="bg-app-card/20 border border-app-border p-4 rounded-sm flex items-center justify-between group hover:border-white/10 transition-all">
            <div className="flex items-center gap-3">
              <stat.icon className={cn("h-4 w-4 opacity-50", stat.color)} />
              <span className="tactical-label !text-[8px]">{stat.label}</span>
            </div>
            <span className={cn("text-sm font-black tabular-nums tracking-tighter", stat.color)}>{stat.val}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
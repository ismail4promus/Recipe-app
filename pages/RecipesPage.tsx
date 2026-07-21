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
import { Chip } from "../components/ui/kit";

const categories = [
  { v: "All", l: "All" },
  { v: "Main Course", l: "Main Course" },
  { v: "Appetizer", l: "Appetizer" },
  { v: "Dessert", l: "Dessert" },
  { v: "Beverage", l: "Beverage" }
];

const TacticalRecipeCard: React.FC<{
  recipe: Recipe;
  viewMode: 'grid' | 'list';
  onToggleFavorite: (recipe: Recipe) => void;
  pantryIngredients: Ingredient[];
}> = React.memo(({ recipe, viewMode, onToggleFavorite, pantryIngredients }) => {
  const navigate = useNavigate();

  const { pricePerPerson, difficultyColor } = useMemo(() => {
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
        className="group flex flex-row items-center gap-4 p-3 bg-app-card border border-app-border rounded-2xl hover:border-app-primary/40 cursor-pointer transition-all active:scale-[0.99] relative overflow-hidden shadow-soft"
      >
        {recipe.isFavorite && <div className="absolute top-0 left-0 w-1 h-full bg-app-primary" />}

        <div className="relative w-24 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-app-elevated border border-app-border">
          <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-app-text text-sm truncate tracking-tight group-hover:text-app-primary transition-colors">{recipe.name}</h3>
            {recipe.isFavorite && <Star className="h-3.5 w-3.5 fill-app-warning text-app-warning shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-app-muted font-medium px-2 py-0.5 bg-app-elevated rounded-full">{recipe.category}</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-app-muted" />
              <span className="text-xs font-medium text-app-muted tabular-nums">{recipe.prepTime + recipe.cookTime}m</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 shrink-0 px-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-app-muted font-medium mb-1">Difficulty</span>
            <div className={cn("flex items-center gap-1.5 text-xs font-semibold", difficultyColor)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> {recipe.difficulty}
            </div>
          </div>
          <div className="text-right border-l border-app-border pl-8 min-w-[100px]">
            <span className="text-xs text-app-muted font-medium mb-1 block">Cost Per Serving</span>
            <div className="text-sm font-bold text-app-primary tabular-nums tracking-tight">{formatCurrency(pricePerPerson)}</div>
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
      className="group bg-app-card rounded-2xl overflow-hidden cursor-pointer flex flex-col hover:border-app-primary/40 transition-all border border-app-border shadow-soft relative"
    >
      <div className="absolute top-3 left-3 z-20">
        <span className="text-xs font-semibold text-white bg-app-primary px-3 py-1 rounded-full shadow-soft">
          {recipe.cuisine}
        </span>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden bg-app-elevated">
        <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />

        {/* Rapid Actions */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-4px] group-hover:translate-y-0 duration-300">
           <button aria-label="Toggle favorite" onClick={handleFavoriteClick} className="h-8 w-8 bg-app-card/90 backdrop-blur-md rounded-full text-app-text hover:text-app-primary transition-all border border-app-border shadow-soft flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
               <Star className={cn("h-4 w-4 transition-all", recipe.isFavorite && "fill-app-warning text-app-warning scale-110")} />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow relative z-10 space-y-4">
        <div className="space-y-1">
          <span className="text-xs text-app-muted font-medium">{recipe.category}</span>
          <h3 className="font-semibold text-sm tracking-tight line-clamp-2 group-hover:text-app-primary transition-colors leading-snug h-8 text-app-text">{recipe.name}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-app-elevated p-3 rounded-xl border border-app-border flex flex-col justify-center">
            <span className="text-xs text-app-muted font-medium mb-1">Cooking Time</span>
            <div className="flex items-center gap-2 text-sm font-semibold text-app-text tabular-nums">
              <Clock className="h-3.5 w-3.5 text-app-primary" /> {recipe.prepTime + recipe.cookTime}m
            </div>
          </div>
          <div className="bg-app-elevated p-3 rounded-xl border border-app-border flex flex-col justify-center items-end text-right">
            <span className="text-xs text-app-muted font-medium mb-1">Difficulty</span>
            <div className={cn("flex items-center gap-2 text-sm font-semibold tabular-nums", difficultyColor)}>
              <Activity className="h-3.5 w-3.5" /> {recipe.difficulty}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-app-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-app-muted font-medium mb-1">Cost Per Serving</span>
            <span className="text-base font-bold text-app-text tabular-nums leading-none tracking-tight">{formatCurrency(pricePerPerson)}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-app-elevated text-app-primary flex items-center justify-center border border-app-border group-hover:bg-app-primary group-hover:text-white transition-all shadow-soft active:scale-90">
            <ArrowRight className="h-4 w-4" />
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
      {/* Header */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-app-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 bg-app-primary/10 rounded-xl flex items-center justify-center border border-app-primary/20">
              <Cpu className="h-6 w-6 text-app-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-app-text leading-none">Recipes</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-2 w-2 rounded-full bg-app-success"></span>
                <span className="text-xs text-app-muted font-medium">{recipes.length} recipes</span>
              </div>
            </div>
          </div>
        </div>

        <Link to="/recipes/new" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-app-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-105 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
          <Plus className="h-[18px] w-[18px]" /> Add Recipe
        </Link>
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="sticky top-14 md:top-16 z-30 py-2">
        <div className="bg-app-card/80 backdrop-blur-xl border border-app-border p-3 rounded-2xl flex flex-col lg:flex-row gap-3 shadow-soft">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
            <input
              placeholder="Search recipes…"
              aria-label="Search recipes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 pr-4 rounded-full bg-app-elevated border border-app-border text-sm text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 placeholder:text-app-muted transition-all"
            />
          </div>

          <div className="flex gap-2 items-center px-1">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {categories.map(c => (
                <Chip
                  key={c.v}
                  active={selectedCategory === c.v}
                  onClick={() => setSelectedCategory(c.v)}
                >
                  {c.l}
                </Chip>
              ))}
            </div>

            <div className="h-8 w-px bg-app-border mx-1 hidden lg:block" />

            <div className="flex bg-app-elevated p-1 rounded-full border border-app-border shrink-0">
              <button
                aria-label="Grid view"
                onClick={() => setViewMode("grid")}
                className={cn("p-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60", viewMode==='grid'?'bg-app-primary text-white':'text-app-muted hover:text-app-text')}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                aria-label="List view"
                onClick={() => setViewMode("list")}
                className={cn("p-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60", viewMode==='list'?'bg-app-primary text-white':'text-app-muted hover:text-app-text')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recipe Grid */}
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
              className="col-span-full flex flex-col items-center justify-center py-32 bg-app-card border border-dashed border-app-border rounded-2xl"
            >
              <div className="h-16 w-16 rounded-full bg-app-elevated flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-app-muted" />
              </div>
              <p className="text-app-muted font-medium">No recipes found</p>
              <button
                onClick={() => {setSearchQuery(""); setSelectedCategory("All");}}
                className="mt-4 text-sm font-semibold text-app-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 rounded-full px-3 py-1"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Footer */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-app-border">
        {[
          { label: "Total Recipes", val: recipes.length, icon: Layers, color: "text-app-primary" },
          { label: "Favorites", val: recipes.filter(r => r.isFavorite).length, icon: Star, color: "text-app-warning" },
          { label: "Status", val: "Ready", icon: Shield, color: "text-app-success" }
        ].map(stat => (
          <div key={stat.label} className="bg-app-card border border-app-border p-4 rounded-2xl flex items-center justify-between group hover:border-app-primary/30 transition-all shadow-soft">
            <div className="flex items-center gap-3">
              <stat.icon className={cn("h-4 w-4", stat.color)} />
              <span className="text-sm text-app-muted font-medium">{stat.label}</span>
            </div>
            <span className={cn("text-base font-bold tabular-nums tracking-tight", stat.color)}>{stat.val}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

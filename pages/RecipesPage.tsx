import React, { useState, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Grid3X3, List, Plus, Star, Clock, Search, ArrowRight, ArrowUpDown, Download, Upload, MoreVertical } from "lucide-react";
import { useData } from "../context/DataContext";
import { Recipe, Ingredient } from "../types";
import { formatCurrency, cn, ANIMATION_VARIANTS } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Chip } from "../components/ui/kit";
import { StickyToolbar } from "../components/ui/StickyToolbar";
import { exportRecipes, parseImportedRecipes } from "../lib/recipeIO";

const CATEGORIES = ["All", "Main Course", "Appetizer", "Dessert", "Beverage"];
type SortKey = "featured" | "name" | "cost" | "time";
const SORTS: { v: SortKey; l: string }[] = [
  { v: "featured", l: "Featured" },
  { v: "name", l: "Name A–Z" },
  { v: "cost", l: "Cost: low → high" },
  { v: "time", l: "Quickest first" },
];

const DIFF: Record<string, string> = {
  Easy: "text-app-success",
  Medium: "text-app-warning",
  Hard: "text-app-danger",
};

// Cost per serving using real ingredient costs (same math as the detail page).
const costPerServing = (recipe: Recipe, pantry: Ingredient[]) => {
  let raw = 0;
  recipe.ingredientSections?.forEach(sec => sec.ingredients?.forEach(ing => {
    const item = pantry.find(pi => pi.id === ing.ingredientId);
    const unit = ing.manualCostPerUnit !== undefined ? ing.manualCostPerUnit : (item?.costPerUnit || 0);
    raw += ing.quantity * unit;
  }));
  const total = raw + raw * (recipe.overheadPercentage / 100) + raw * (recipe.profitMargin / 100);
  return total / (recipe.servings || 1);
};

const RecipeCard: React.FC<{
  recipe: Recipe;
  viewMode: "grid" | "list";
  cost: number;
  onToggleFavorite: (r: Recipe) => void;
}> = React.memo(({ recipe, viewMode, cost, onToggleFavorite }) => {
  const navigate = useNavigate();
  const minutes = recipe.prepTime + recipe.cookTime;
  const diffColor = DIFF[recipe.difficulty] || "text-app-muted";

  const fav = (e: React.MouseEvent) => { e.stopPropagation(); onToggleFavorite(recipe); };

  if (viewMode === "list") {
    return (
      <div
        onClick={() => navigate(`/recipes/${recipe.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate(`/recipes/${recipe.id}`)}
        className="group relative flex items-center gap-3 rounded-md border border-app-border bg-app-card p-2.5 shadow-soft transition-colors hover:border-app-primary/40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
      >
        {recipe.isFavorite && <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-md bg-app-primary" />}
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-app-border bg-app-elevated">
          <img src={recipe.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-app-text">{recipe.name}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-app-muted">
            <span className="truncate">{recipe.category}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{minutes}m</span>
            <span className={cn("inline-flex items-center gap-1 font-medium", diffColor)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />{recipe.difficulty}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] text-app-muted">Per serving</p>
          <p className="text-sm font-bold tabular-nums text-app-text">{formatCurrency(cost)}</p>
        </div>
        <button onClick={fav} aria-label={recipe.isFavorite ? "Unfavorite" : "Favorite"} className="shrink-0 p-1.5 text-app-muted hover:text-app-warning focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 rounded-md">
          <Star className={cn("h-4 w-4", recipe.isFavorite && "fill-app-warning text-app-warning")} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/recipes/${recipe.id}`)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-md border border-app-border bg-app-card shadow-soft transition-all hover:-translate-y-0.5 hover:border-app-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-app-elevated">
        <img src={recipe.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <button
          onClick={fav}
          aria-label={recipe.isFavorite ? "Unfavorite" : "Favorite"}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-app-border bg-app-card/90 text-app-muted backdrop-blur-sm transition-colors hover:text-app-warning focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
        >
          <Star className={cn("h-4 w-4", recipe.isFavorite && "fill-app-warning text-app-warning")} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[11px] font-medium text-app-muted">{recipe.category}</p>
        <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-app-text group-hover:text-app-primary">{recipe.name}</h3>
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-app-border pt-2">
          <div className="flex items-center gap-2 text-xs text-app-muted">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{minutes}m</span>
            <span className={cn("inline-flex items-center gap-1 font-medium", diffColor)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />{recipe.difficulty}
            </span>
          </div>
          <span className="text-sm font-bold tabular-nums text-app-text">{formatCurrency(cost)}</span>
        </div>
      </div>
    </div>
  );
});

export default function RecipesPage() {
  const { recipes, updateRecipe, batchAddRecipes, ingredients } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    setMenuOpen(false);
    if (recipes.length === 0) {
      alert("No recipes to export.");
      return;
    }
    exportRecipes(recipes);
  }, [recipes]);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseImportedRecipes(text);
      await batchAddRecipes(imported);
      alert(`Imported ${imported.length} recipe${imported.length === 1 ? "" : "s"}.`);
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [batchAddRecipes]);

  // Cost per serving computed once per recipe (reused for display + sorting).
  const costMap = useMemo(() => {
    const m = new Map<string, number>();
    recipes.forEach(r => m.set(r.id, costPerServing(r, ingredients)));
    return m;
  }, [recipes, ingredients]);

  const filteredRecipes = useMemo(() => {
    const list = recipes.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
      const matchesFav = !favoritesOnly || r.isFavorite;
      return matchesSearch && matchesCategory && matchesFav;
    });
    return list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "cost") return (costMap.get(a.id) || 0) - (costMap.get(b.id) || 0);
      if (sortBy === "time") return (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime);
      // featured: favorites first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [recipes, searchQuery, selectedCategory, favoritesOnly, sortBy, costMap]);

  const toggleFavorite = useCallback((recipe: Recipe) => {
    updateRecipe({ ...recipe, isFavorite: !recipe.isFavorite });
  }, [updateRecipe]);

  const favCount = recipes.filter(r => r.isFavorite).length;

  return (
    <motion.div
      initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container}
      className="mx-auto max-w-[1500px] space-y-2.5 pb-20"
    >
      {/* Header */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="flex items-center justify-between gap-2.5 border-b border-app-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text md:text-2xl">Recipes</h1>
          <p className="mt-0.5 text-sm text-app-muted">
            {filteredRecipes.length} of {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
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
              aria-label="Import or export recipes"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="Import / export"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-app-border bg-app-elevated text-app-muted shadow-soft transition-all hover:text-app-text hover:border-app-primary/40 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
            >
              <MoreVertical className="h-[18px] w-[18px]" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div role="menu" className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-md border border-app-border bg-app-card py-1 shadow-soft">
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
                    <Download className="h-4 w-4 text-app-muted" /> Export (CSV)
                  </button>
                </div>
              </>
            )}
          </div>
          <Link to="/recipes/new" aria-label="Add recipe" className="inline-flex h-10 items-center justify-center gap-2 bg-app-primary px-3 sm:px-4 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-105 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
            <Plus className="h-[18px] w-[18px]" /> <span className="hidden sm:inline">Add Recipe</span>
          </Link>
        </div>
      </motion.div>

      {/* Search + filters + sort */}
      <StickyToolbar>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-grow">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
            <input
              placeholder="Search recipes…"
              aria-label="Search recipes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full border border-app-border bg-app-elevated pl-9 pr-3 text-sm text-app-text placeholder:text-app-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(c => (
              <Chip key={c} active={selectedCategory === c} onClick={() => setSelectedCategory(c)}>{c}</Chip>
            ))}
            <Chip active={favoritesOnly} onClick={() => setFavoritesOnly(v => !v)}>
              <span className="inline-flex items-center gap-1"><Star className={cn("h-3.5 w-3.5", favoritesOnly && "fill-current")} />{favCount}</span>
            </Chip>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-app-muted" />
              <select
                aria-label="Sort recipes"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="h-10 rounded-md border border-app-border bg-app-elevated pl-8 pr-3 text-sm font-medium text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
              >
                {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>
            <div className="flex overflow-hidden rounded-md border border-app-border">
              <button aria-label="Grid view" onClick={() => setViewMode("grid")} className={cn("flex h-10 w-9 items-center justify-center transition-colors", viewMode === "grid" ? "bg-app-primary text-primary-foreground" : "bg-app-elevated text-app-muted hover:text-app-text")}>
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button aria-label="List view" onClick={() => setViewMode("list")} className={cn("flex h-10 w-9 items-center justify-center border-l border-app-border transition-colors", viewMode === "list" ? "bg-app-primary text-primary-foreground" : "bg-app-elevated text-app-muted hover:text-app-text")}>
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </StickyToolbar>

      {/* Results */}
      {filteredRecipes.length > 0 ? (
        <div className={cn(
          viewMode === "grid"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            : "flex flex-col gap-2"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredRecipes.map(recipe => (
              <motion.div key={recipe.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <RecipeCard recipe={recipe} viewMode={viewMode} cost={costMap.get(recipe.id) || 0} onToggleFavorite={toggleFavorite} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-app-border bg-app-card py-14 text-center">
          <Search className="h-8 w-8 text-app-muted" />
          <p className="mt-3 text-sm font-medium text-app-text">No recipes match your filters</p>
          <button
            onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setFavoritesOnly(false); }}
            className="mt-3 rounded-md px-3 py-1.5 text-sm font-semibold text-app-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
          >
            Clear filters
          </button>
        </div>
      )}
    </motion.div>
  );
}

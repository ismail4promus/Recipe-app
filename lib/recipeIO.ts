import { Recipe } from '../types';
import { escapeCell, parseCSV, download } from './csv';

// Columns written per recipe. Scalars map to plain cells; nested structures
// (arrays/objects) are JSON-encoded inside a single quoted cell so the CSV
// stays valid and round-trips cleanly back through parseImportedRecipes.
const COLUMNS = [
  'name', 'category', 'cuisine', 'prepTime', 'cookTime', 'servings', 'difficulty',
  'overheadPercentage', 'profitMargin', 'imageUrl',
  'tags', 'allergens', 'nutrition', 'ingredientSections', 'steps',
] as const;

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'recipe';

// --- Export -----------------------------------------------------------------

function recipesToCSV(recipes: Recipe[]): string {
  const header = COLUMNS.join(',');
  const lines = recipes.map(r => COLUMNS.map(col => escapeCell(cellFor(r, col))).join(','));
  return [header, ...lines].join('\r\n');
}

function cellFor(r: Recipe, col: string): string {
  const v = (r as any)[col];
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// Export all recipes to a single CSV download.
export function exportRecipes(recipes: Recipe[], now: Date = new Date()): void {
  download(`icooking-recipes-${now.toISOString().slice(0, 10)}.csv`, recipesToCSV(recipes));
}

// Export a single recipe to its own CSV download.
export function exportRecipe(recipe: Recipe, now: Date = new Date()): void {
  download(`icooking-recipe-${slug(recipe.name)}-${now.toISOString().slice(0, 10)}.csv`, recipesToCSV([recipe]));
}

// --- Import -----------------------------------------------------------------

const parseJSONCell = <T,>(cell: string, fallback: T): T => {
  const t = cell.trim();
  if (!t) return fallback;
  try { return JSON.parse(t) as T; } catch { return fallback; }
};

// Parse imported CSV text into ready-to-add recipes with fresh IDs.
export function parseImportedRecipes(text: string): Recipe[] {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('No recipes found in file.');

  const header = rows[0].map(h => h.trim());
  const nameIdx = header.indexOf('name');
  if (nameIdx === -1) throw new Error('CSV is missing a "name" column.');

  const recipes = rows.slice(1).map((row, i) => {
    const get = (col: string) => {
      const idx = header.indexOf(col);
      return idx === -1 ? '' : (row[idx] ?? '');
    };
    return normalizeRecipe(get, i);
  });

  if (recipes.length === 0) throw new Error('No recipes found in file.');
  return recipes;
}

// Build a valid Recipe from CSV cell getters, regenerating all nested IDs.
function normalizeRecipe(get: (col: string) => string, index: number): Recipe {
  const name = get('name').trim();
  if (!name) throw new Error(`Row ${index + 1} is missing a recipe name.`);

  const now = Date.now();
  const rawSections = parseJSONCell<any[]>(get('ingredientSections'), []);
  const ingredientSections = (Array.isArray(rawSections) ? rawSections : []).map((sec: any, si: number) => ({
    id: `sec_${now}_${index}_${si}`,
    name: typeof sec?.name === 'string' ? sec.name : 'Ingredients',
    ingredients: Array.isArray(sec?.ingredients)
      ? sec.ingredients.map((ing: any, ii: number) => ({
          id: `ri_${now}_${index}_${si}_${ii}`,
          ingredientId: typeof ing?.ingredientId === 'string' ? ing.ingredientId : '',
          name: typeof ing?.name === 'string' ? ing.name : '',
          quantity: Number(ing?.quantity) || 0,
          unit: typeof ing?.unit === 'string' ? ing.unit : '',
          type: ing?.type,
          notes: ing?.notes,
          manualCostPerUnit: ing?.manualCostPerUnit,
        }))
      : [],
  }));

  const rawSteps = parseJSONCell<any[]>(get('steps'), []);
  const steps = (Array.isArray(rawSteps) ? rawSteps : []).map((st: any, sti: number) => ({
    id: `step_${now}_${index}_${sti}`,
    stepNumber: sti + 1,
    instruction: typeof st?.instruction === 'string' ? st.instruction : '',
    duration: st?.duration,
    linkedIngredientIds: Array.isArray(st?.linkedIngredientIds) ? st.linkedIngredientIds : undefined,
  }));

  const tags = parseJSONCell<string[]>(get('tags'), []);
  const allergens = parseJSONCell<string[]>(get('allergens'), []);
  const nutrition = parseJSONCell<any>(get('nutrition'), undefined);
  const difficulty = get('difficulty').trim();

  return {
    id: `rec_${now}_${index}`,
    name,
    category: get('category').trim() || 'Main Course',
    cuisine: get('cuisine').trim(),
    prepTime: Number(get('prepTime')) || 0,
    cookTime: Number(get('cookTime')) || 0,
    servings: Number(get('servings')) || 1,
    difficulty: difficulty === 'Easy' || difficulty === 'Medium' || difficulty === 'Hard' ? difficulty : 'Medium',
    ingredientSections,
    steps,
    isFavorite: false,
    overheadPercentage: Number(get('overheadPercentage')) || 0,
    profitMargin: Number(get('profitMargin')) || 0,
    imageUrl: get('imageUrl').trim(),
    createdAt: new Date(),
    tags: Array.isArray(tags) && tags.length ? tags : undefined,
    nutrition: nutrition && typeof nutrition === 'object' ? nutrition : undefined,
    allergens: Array.isArray(allergens) && allergens.length ? allergens : undefined,
  };
}

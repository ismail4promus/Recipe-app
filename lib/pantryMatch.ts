import { Ingredient, RecipeIngredient } from '../types';
import { normalizeUnit, unitDimension } from './units';

/**
 * Matching recipe lines to pantry items.
 *
 * Recipes and inventory are usually typed by different people at different
 * times ("Maida (All Purpose Flour)" vs "All-Purpose Flour"), so the ids often
 * do not line up even when both sides clearly mean the same thing.
 */

export type MatchConfidence = 'exact' | 'close';

export interface PantryMatch {
  item: Ingredient;
  confidence: MatchConfidence;
}

/** Words that describe preparation, not identity — they should not block a match. */
const NOISE = new Set([
  'fresh', 'dried', 'chopped', 'minced', 'sliced', 'diced', 'grated', 'ground',
  'whole', 'raw', 'cooked', 'large', 'small', 'medium', 'to', 'taste', 'optional',
]);

/** Lowercase, drop bracketed asides and punctuation, singularise, drop noise words. */
export const normalizeName = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')       // "Besan (Gram Flour)" -> "Besan"
    .replace(/[^a-z0-9\s]/g, ' ')     // punctuation and dashes
    .split(/\s+/)
    .filter(Boolean)
    .map(w => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
    .filter(w => !NOISE.has(w))
    .join(' ')
    .trim();

/** Modifiers that change the state of an ingredient, not which ingredient it is. */
const QUALIFIERS = new Set(['hot', 'cold', 'warm', 'boiling', 'chilled', 'room', 'temperature', 'lukewarm']);

/** Every spelling a pantry item answers to: its name plus any bracketed alias. */
const aliasesFor = (item: Ingredient): string[] => {
  const names = [item.name];
  const bracketed = item.name.match(/\(([^)]+)\)/);
  if (bracketed) names.push(bracketed[1]);
  return names.map(normalizeName).filter(Boolean);
};

const tokens = (s: string) => s.split(' ').filter(Boolean);

/**
 * Is `alias` the same ingredient as `target`, allowing for one side being more
 * specific?
 *
 * The head noun must agree ("… water" with "… water"). Extra words are only
 * tolerated when the PANTRY side is the specific one — a kitchen that stocks
 * "Table Salt" satisfies a recipe asking for "Salt". The reverse is not true:
 * "Keora Water" is not satisfied by "Water", and linking them would price a
 * flavouring as tap water. A recipe-side extra is therefore only accepted when
 * every extra word is a state qualifier such as "hot".
 */
const isSameIngredient = (target: string, alias: string): boolean => {
  const t = tokens(target);
  const a = tokens(alias);
  if (t.length === 0 || a.length === 0) return false;
  if (t[t.length - 1] !== a[a.length - 1]) return false;   // different head noun

  const extraInRecipe = t.filter(w => !a.includes(w));
  const extraInPantry = a.filter(w => !t.includes(w));

  if (extraInRecipe.length === 0) return true;                       // pantry is more specific
  return extraInRecipe.every(w => QUALIFIERS.has(w)) && extraInPantry.length === 0;
};

/**
 * Find the pantry item a recipe line refers to. Returns null when there is no
 * match, or when a loose match is ambiguous — a wrong link silently prices the
 * dish against the wrong ingredient, which is worse than leaving it unlinked.
 */
export const findPantryMatch = (recipeName: string, pantry: Ingredient[]): PantryMatch | null => {
  const target = normalizeName(recipeName);
  if (!target) return null;

  const exact = pantry.filter(p => aliasesFor(p).includes(target));
  if (exact.length > 0) return { item: exact[0], confidence: 'exact' };

  const close = pantry.filter(p => aliasesFor(p).some(alias => isSameIngredient(target, alias)));
  // Ambiguity is not a match: two plausible candidates means a human should pick.
  if (close.length === 1) return { item: close[0], confidence: 'close' };

  return null;
};

export interface LinkProposal {
  ingredient: RecipeIngredient;
  sectionId: string;
  match: PantryMatch | null;
}

/** Work out, for every unlinked line in a recipe, what it should link to. */
export const proposeLinks = (
  sections: { id: string; ingredients: RecipeIngredient[] }[],
  pantry: Ingredient[]
): LinkProposal[] => {
  const known = new Set(pantry.map(p => p.id));
  const proposals: LinkProposal[] = [];

  sections.forEach(section => {
    section.ingredients.forEach(ingredient => {
      if (ingredient.ingredientId && known.has(ingredient.ingredientId)) return;
      proposals.push({
        ingredient,
        sectionId: section.id,
        match: findPantryMatch(ingredient.name, pantry),
      });
    });
  });

  return proposals;
};

/**
 * Build a pantry record for a recipe line that has nothing to link to. Stock and
 * cost start at zero — the point is to create something linkable and priceable,
 * not to invent numbers.
 */
export const pantryItemFromRecipeIngredient = (
  ingredient: RecipeIngredient,
  index: number,
  now: number = 0
): Ingredient => {
  const unit = normalizeUnit(ingredient.unit) ?? 'g';
  // A count unit ("2 pc onion") makes a poor base unit for weighing stock, but
  // it is the only honest one until someone enters a real package size.
  const baseUnit = unitDimension(unit) === 'count' ? unit : unit;

  return {
    id: `ing_${now}_${index}`,
    name: ingredient.name.trim(),
    category: 'Other',
    baseUnit,
    packageSize: 1,
    packageUnit: 'pack',
    packagesInStock: 0,
    costPerPackage: 0,
    supplier: '',
    shelf_life_days: 365,
    last_verified: new Date(now || Date.now()),
    quantityInStock: 0,
    costPerUnit: 0,
    wastePercentage: 0,
  };
};

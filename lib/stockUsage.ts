import { Ingredient, Recipe } from '../types';
import { baseUnitRatio, formatMeasure, unitLabel } from './units';

/**
 * Working out what cooking a recipe takes out of inventory.
 *
 * Everything is computed in the pantry item's own base unit, and anything that
 * cannot be converted is reported rather than guessed — deducting the wrong
 * amount is worse than deducting nothing.
 */

export interface StockDeduction {
  item: Ingredient;
  /** Amount used, in the pantry item's base unit. */
  amountBase: number;
  /** What the recipe line said, for display: "2 pc". */
  recipeAmount: string;
  stockBefore: number;
  stockAfter: number;
  /** The recipe needs more than is in stock. */
  short: boolean;
}

export interface SkippedUsage {
  name: string;
  reason: 'unlinked' | 'no-conversion';
}

export interface StockUsagePlan {
  deductions: StockDeduction[];
  skipped: SkippedUsage[];
}

/**
 * Build the plan for cooking `recipe` at `servings` portions.
 * Repeated ingredients are merged so an item used in three steps is deducted once.
 */
export const planStockUsage = (
  recipe: Recipe,
  servings: number,
  pantry: Ingredient[]
): StockUsagePlan => {
  const scale = (servings || recipe.servings || 1) / (recipe.servings || 1);
  const lines = recipe.ingredientSections?.flatMap(s => s.ingredients || []) || [];

  const used = new Map<string, { item: Ingredient; amountBase: number; recipeQty: number; unit: string }>();
  const skipped: SkippedUsage[] = [];

  lines.forEach(line => {
    const item = pantry.find(p => p.id === line.ingredientId);
    if (!item) {
      skipped.push({ name: line.name || 'Unnamed ingredient', reason: 'unlinked' });
      return;
    }

    const ratio = baseUnitRatio(line, item.baseUnit, item.unitConversions);
    if (ratio === null) {
      skipped.push({ name: line.name || item.name, reason: 'no-conversion' });
      return;
    }

    const qty = (line.quantity || 0) * scale;
    const amountBase = qty * ratio;
    const existing = used.get(item.id);
    if (existing) {
      existing.amountBase += amountBase;
      // Only keep a readable recipe amount when the units agree; otherwise the
      // base-unit total below is the honest summary.
      existing.recipeQty = existing.unit === line.unit ? existing.recipeQty + qty : NaN;
    } else {
      used.set(item.id, { item, amountBase, recipeQty: qty, unit: line.unit });
    }
  });

  const deductions: StockDeduction[] = Array.from(used.values()).map(u => {
    const stockBefore = u.item.quantityInStock || 0;
    const stockAfter = Math.max(0, stockBefore - u.amountBase);
    return {
      item: u.item,
      amountBase: u.amountBase,
      recipeAmount: Number.isFinite(u.recipeQty)
        ? formatMeasure(u.recipeQty, u.unit)
        : `${u.amountBase.toFixed(2)} ${unitLabel(u.item.baseUnit)}`,
      stockBefore,
      stockAfter,
      short: u.amountBase > stockBefore,
    };
  });

  return { deductions, skipped };
};

/**
 * Apply a plan to inventory records. `packagesInStock` is kept consistent with
 * the new quantity so the pantry cards and low-stock alerts stay truthful.
 */
export const applyStockUsage = (plan: StockUsagePlan): Ingredient[] =>
  plan.deductions.map(d => {
    const packageSize = d.item.packageSize > 0 ? d.item.packageSize : 1;
    return {
      ...d.item,
      quantityInStock: parseFloat(d.stockAfter.toFixed(4)),
      packagesInStock: parseFloat((d.stockAfter / packageSize).toFixed(4)),
      last_verified: new Date(),
    };
  });

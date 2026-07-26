import { Ingredient, Order, OrderStatus, Recipe } from '../types';
import { baseUnitRatio, formatMeasure, unitLabel } from './units';

/**
 * What the kitchen has to buy.
 *
 * Two things put an item on this list, and they are kept apart because they
 * mean different things:
 *
 *  - Committed orders need more of it than inventory holds. That amount is
 *    derived, not guessed: recipe lines are converted into the pantry item's
 *    base unit and summed across every order that is still going to be cooked.
 *  - It is simply out of, or low on, stock. There is no demand figure behind
 *    this, so the suggested quantity is a default the cook can overwrite.
 *
 * Anything that cannot be converted is reported in `unresolved` rather than
 * silently dropped — a shopping list that quietly omits an ingredient is worse
 * than one that says it does not know.
 */

/** At or below this many packages the pantry treats an item as low. */
export const LOW_STOCK_PACKAGES = 2;

/** Default restock target for items with no order demand behind them. */
const RESTOCK_TARGET_PACKAGES = LOW_STOCK_PACKAGES + 1;

/** Orders that still have to be cooked, so their ingredients still have to be bought. */
export const COMMITTED_STATUSES: OrderStatus[] = ['pending_approval', 'approved', 'processing'];

export type ShoppingReason = 'order-demand' | 'out-of-stock' | 'low-stock';

export interface ShoppingLine {
  item: Ingredient;
  reason: ShoppingReason;
  /** Total needed by committed orders, in the item's base unit. 0 when demand is unknown. */
  requiredBase: number;
  inStockBase: number;
  /** How much the orders need beyond what is in stock, in base units. */
  shortfallBase: number;
  /** Whole packages to buy — you cannot buy 0.4 of a sack. */
  packagesToBuy: number;
  estimatedCost: number;
  /** Human-readable shortfall, e.g. "1.4 kg". */
  shortfallLabel: string;
  /** Order numbers driving the demand, so a line can be justified. */
  orderNumbers: string[];
}

export interface UnresolvedLine {
  name: string;
  recipeName: string;
  reason: 'unlinked' | 'no-conversion';
}

export interface ShoppingList {
  lines: ShoppingLine[];
  unresolved: UnresolvedLine[];
  totalCost: number;
  /** Number of lines that exist because an order needs them. */
  demandCount: number;
}

interface Demand {
  base: number;
  orderNumbers: Set<string>;
}

/**
 * Round a base-unit amount up to whole packages.
 * A zero or missing package size means the item is tracked one-for-one.
 */
const packagesFor = (amountBase: number, packageSize: number): number => {
  const size = packageSize > 0 ? packageSize : 1;
  return Math.ceil(amountBase / size - 1e-9);
};

/** A tidy amount label: prefers the item's own base unit. */
const amountLabel = (amountBase: number, baseUnit: string): string => {
  // Show kg/L once the number gets long, the way a cook would say it.
  if (baseUnit === 'g' && amountBase >= 1000) return formatMeasure(amountBase / 1000, 'kg');
  if (baseUnit === 'ml' && amountBase >= 1000) return formatMeasure(amountBase / 1000, 'l');
  return `${Number(amountBase.toFixed(2))} ${unitLabel(baseUnit)}`;
};

/**
 * Build the buy list from committed orders plus whatever is running out.
 *
 * An order line's `quantity` is a multiple of the whole recipe — the same
 * reading the dashboard uses when it schedules cooking — so a quantity of 3
 * multiplies every ingredient by 3.
 */
export const buildShoppingList = (
  orders: Order[],
  recipes: Recipe[],
  pantry: Ingredient[]
): ShoppingList => {
  const recipeById = new Map<string, Recipe>(recipes.map(r => [r.id, r] as [string, Recipe]));
  const demand = new Map<string, Demand>();
  const unresolved: UnresolvedLine[] = [];
  const unresolvedSeen = new Set<string>();

  const committed = orders.filter(o => COMMITTED_STATUSES.includes(o.status));

  committed.forEach(order => {
    order.items?.forEach(orderItem => {
      const recipe = recipeById.get(orderItem.recipeId);
      if (!recipe) return;
      const batches = Number(orderItem.quantity) || 0;
      if (batches <= 0) return;

      recipe.ingredientSections?.forEach(section => {
        section.ingredients?.forEach(line => {
          const item = pantry.find(p => p.id === line.ingredientId);
          const key = `${recipe.id}:${line.id}`;

          if (!item) {
            if (!unresolvedSeen.has(key)) {
              unresolvedSeen.add(key);
              unresolved.push({ name: line.name || 'Unnamed ingredient', recipeName: recipe.name, reason: 'unlinked' });
            }
            return;
          }

          const ratio = baseUnitRatio(line, item.baseUnit, item.unitConversions);
          if (ratio === null) {
            if (!unresolvedSeen.has(key)) {
              unresolvedSeen.add(key);
              unresolved.push({ name: line.name || item.name, recipeName: recipe.name, reason: 'no-conversion' });
            }
            return;
          }

          const entry = demand.get(item.id) || { base: 0, orderNumbers: new Set<string>() };
          entry.base += (line.quantity || 0) * ratio * batches;
          entry.orderNumbers.add(order.orderNumber);
          demand.set(item.id, entry);
        });
      });
    });
  });

  const lines: ShoppingLine[] = [];

  pantry.forEach(item => {
    const entry = demand.get(item.id);
    const requiredBase = entry?.base || 0;
    const inStockBase = Number(item.quantityInStock) || 0;
    const shortfallBase = Math.max(0, requiredBase - inStockBase);
    const packages = Number(item.packagesInStock) || 0;

    let reason: ShoppingReason;
    let packagesToBuy: number;

    if (shortfallBase > 0) {
      reason = 'order-demand';
      packagesToBuy = packagesFor(shortfallBase, item.packageSize);
    } else if (packages <= 0) {
      reason = 'out-of-stock';
      packagesToBuy = RESTOCK_TARGET_PACKAGES;
    } else if (packages <= LOW_STOCK_PACKAGES) {
      reason = 'low-stock';
      packagesToBuy = Math.max(1, Math.ceil(RESTOCK_TARGET_PACKAGES - packages));
    } else {
      return; // Enough in stock and nothing committed needs more.
    }

    if (packagesToBuy <= 0) return;

    lines.push({
      item,
      reason,
      requiredBase,
      inStockBase,
      shortfallBase,
      packagesToBuy,
      estimatedCost: packagesToBuy * (Number(item.costPerPackage) || 0),
      shortfallLabel: shortfallBase > 0 ? amountLabel(shortfallBase, item.baseUnit) : '',
      orderNumbers: entry ? Array.from(entry.orderNumbers) : [],
    });
  });

  // Orders first — those block cooking that is already promised.
  const rank: Record<ShoppingReason, number> = { 'order-demand': 0, 'out-of-stock': 1, 'low-stock': 2 };
  lines.sort((a, b) => rank[a.reason] - rank[b.reason] || a.item.name.localeCompare(b.item.name));

  return {
    lines,
    unresolved,
    totalCost: lines.reduce((sum, l) => sum + l.estimatedCost, 0),
    demandCount: lines.filter(l => l.reason === 'order-demand').length,
  };
};

/** Plain text for a phone's notes app or a message to whoever does the run. */
export const shoppingListToText = (lines: ShoppingLine[], quantities: Record<string, number>): string =>
  lines
    .map(l => {
      const qty = quantities[l.item.id] ?? l.packagesToBuy;
      const size = l.item.packageSize ? ` (${l.item.packageSize}${unitLabel(l.item.baseUnit)} each)` : '';
      return `- ${l.item.name} — ${qty} × ${l.item.packageUnit}${size}`;
    })
    .join('\n');

/** CSV for a supplier or a spreadsheet. */
export const shoppingListToCsv = (lines: ShoppingLine[], quantities: Record<string, number>): string => {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['Item', 'Category', 'Supplier', 'Packages to buy', 'Package unit', 'Package size', 'Base unit', 'Cost per package', 'Estimated cost', 'Reason'];
  const rows = lines.map(l => {
    const qty = quantities[l.item.id] ?? l.packagesToBuy;
    return [
      l.item.name,
      l.item.category,
      l.item.supplier,
      qty,
      l.item.packageUnit,
      l.item.packageSize,
      l.item.baseUnit,
      l.item.costPerPackage,
      Number((qty * (Number(l.item.costPerPackage) || 0)).toFixed(2)),
      l.reason,
    ].map(escape).join(',');
  });
  return [header.join(','), ...rows].join('\n');
};

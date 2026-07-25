import { Ingredient } from '../types';
import { parseCSV, toCSV, download, columnIndex } from './csv';
import { normalizeUnit } from './units';

/**
 * Inventory CSV. Every column is a plain scalar — an inventory sheet is the
 * one thing kitchen staff are most likely to edit by hand in Excel, so nothing
 * here is JSON-encoded. `quantityInStock` and `costPerUnit` are derived on
 * import and exported only for reference.
 */
const COLUMNS = [
  'id',
  'name',
  'category',
  'baseUnit',
  'packageSize',
  'packageUnit',
  'packagesInStock',
  'costPerPackage',
  'supplier',
  'shelf_life_days',
  'wastePercentage',
  'last_verified',
  'quantityInStock',
  'costPerUnit',
] as const;

/** Columns a hand-written sheet has to provide; the rest fall back to defaults. */
export const REQUIRED_COLUMNS = ['name'] as const;

const asDate = (v: any): Date => (v instanceof Date && !isNaN(v.getTime()) ? v : new Date());

const cellFor = (i: Ingredient, col: string): string => {
  if (col === 'last_verified') return asDate(i.last_verified).toISOString().slice(0, 10);
  const v = (i as any)[col];
  if (v === undefined || v === null) return '';
  return String(v);
};

// --- Export -----------------------------------------------------------------

/** Export the given inventory items to a CSV download. */
export function exportIngredients(ingredients: Ingredient[], now: Date = new Date()): void {
  const rows = ingredients.map(i => COLUMNS.map(col => cellFor(i, col)));
  download(`cookjatra-inventory-${now.toISOString().slice(0, 10)}.csv`, toCSV(COLUMNS, rows));
}

/** A header-only CSV people can fill in and import back. */
export function downloadIngredientTemplate(): void {
  const example = [
    '', 'Basmati Rice', 'Grains', 'g', '5000', 'bag', '2', '15.00', 'Asian Market', '365', '0',
    new Date().toISOString().slice(0, 10), '', '',
  ];
  download('cookjatra-inventory-template.csv', toCSV(COLUMNS, [example]));
}

// --- Import -----------------------------------------------------------------

export interface IngredientImportResult {
  /** Ready to hand to batchAddIngredients — existing rows keep their id, so they update in place. */
  items: Ingredient[];
  created: number;
  updated: number;
  /** Row-level problems that did not stop the import. */
  warnings: string[];
}

const num = (raw: string, fallback = 0): number => {
  // Tolerate "1,200", "$15.00" and stray spaces from spreadsheet exports.
  const cleaned = raw.replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : fallback;
};

const parseDate = (raw: string): Date => {
  const t = raw.trim();
  if (!t) return new Date();
  const d = new Date(t);
  return isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Parse an inventory CSV. Rows are matched against `existing` by id first and
 * then by name (case-insensitive), so re-importing an edited export updates the
 * items instead of creating duplicates.
 */
export function parseImportedIngredients(text: string, existing: Ingredient[] = []): IngredientImportResult {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('No inventory rows found in file.');

  const header = rows[0].map(h => h.trim());
  if (columnIndex(header, 'name') === -1) {
    throw new Error('CSV is missing a "name" column.');
  }

  const byId = new Map(existing.map(i => [i.id, i]));
  const byName = new Map(existing.map(i => [i.name.trim().toLowerCase(), i]));

  const warnings: string[] = [];
  // Keyed by resolved id so repeated names inside one file collapse into a
  // single item rather than creating duplicate pantry entries.
  const result = new Map<string, Ingredient>();
  const pendingByName = new Map<string, string>();
  let created = 0;
  let updated = 0;

  rows.slice(1).forEach((row, idx) => {
    const rowNumber = idx + 2; // 1-based, and the header is row 1
    const get = (col: string) => {
      const i = columnIndex(header, col);
      return i === -1 ? '' : (row[i] ?? '').trim();
    };

    const name = get('name');
    if (!name) {
      warnings.push(`Row ${rowNumber}: skipped — no name.`);
      return;
    }

    const key = name.toLowerCase();
    const match = (get('id') && byId.get(get('id'))) || byName.get(key);
    const earlierId = pendingByName.get(key);
    const id = match?.id || earlierId || `ing_${Date.now()}_${idx}`;

    if (result.has(id)) {
      warnings.push(`Row ${rowNumber}: "${name}" appears more than once — the last row wins.`);
    }
    pendingByName.set(key, id);

    const rawBaseUnit = get('baseUnit') || match?.baseUnit || 'g';
    const baseUnit = normalizeUnit(rawBaseUnit) ?? rawBaseUnit;
    if (!normalizeUnit(rawBaseUnit)) {
      warnings.push(`Row ${rowNumber}: unit "${rawBaseUnit}" is not recognised — costing will not convert it.`);
    }

    const packageSize = num(get('packageSize'), match?.packageSize ?? 1) || 1;
    const packagesInStock = num(get('packagesInStock'), match?.packagesInStock ?? 0);
    const costPerPackage = num(get('costPerPackage'), match?.costPerPackage ?? 0);

    const item: Ingredient = {
      id,
      name,
      category: get('category') || match?.category || 'Other',
      baseUnit,
      packageSize,
      packageUnit: get('packageUnit') || match?.packageUnit || 'pack',
      packagesInStock,
      costPerPackage,
      supplier: get('supplier') || match?.supplier || '',
      shelf_life_days: num(get('shelf_life_days'), match?.shelf_life_days ?? 365),
      last_verified: get('last_verified') ? parseDate(get('last_verified')) : asDate(match?.last_verified),
      wastePercentage: num(get('wastePercentage'), match?.wastePercentage ?? 0),
      // Always recomputed — a stale figure in the sheet would corrupt costing.
      quantityInStock: packageSize * packagesInStock,
      costPerUnit: packageSize > 0 ? costPerPackage / packageSize : 0,
    };

    // A repeat of a row already counted must not be counted again.
    if (!result.has(id)) {
      if (match) updated++; else created++;
    }
    result.set(id, item);
  });

  const items = Array.from(result.values());
  if (items.length === 0) throw new Error('No usable inventory rows found in file.');
  return { items, created, updated, warnings };
}

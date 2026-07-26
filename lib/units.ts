// --- Measurement system ---------------------------------------------------
// One place that knows what a unit is, how to spell it, and what it converts to.
// Recipe data in the wild is messy ("KG", "gm", "PC", "TBS", "Ea"), so every
// entry point normalizes through the alias table before doing any math.

export type Dimension = 'mass' | 'volume' | 'count';

export interface UnitDef {
    id: string;          // canonical id, stored on the recipe
    label: string;       // what the user sees
    dimension: Dimension;
    factor: number;      // amount of the base unit (g / ml / 1) in one of these
    aliases: string[];
}

export const UNITS: UnitDef[] = [
    // Mass — base: g
    { id: 'mg', label: 'mg', dimension: 'mass', factor: 0.001, aliases: ['milligram', 'milligrams', 'mgs'] },
    { id: 'g', label: 'g', dimension: 'mass', factor: 1, aliases: ['gram', 'grams', 'gm', 'gms', 'gr', 'grm'] },
    { id: 'kg', label: 'kg', dimension: 'mass', factor: 1000, aliases: ['kilo', 'kilos', 'kilogram', 'kilograms', 'kgs'] },
    { id: 'oz', label: 'oz', dimension: 'mass', factor: 28.3495, aliases: ['ounce', 'ounces', 'ozs'] },
    { id: 'lb', label: 'lb', dimension: 'mass', factor: 453.592, aliases: ['pound', 'pounds', 'lbs'] },

    // Volume — base: ml
    { id: 'ml', label: 'ml', dimension: 'volume', factor: 1, aliases: ['milliliter', 'millilitre', 'milliliters', 'millilitres', 'mls', 'cc'] },
    { id: 'l', label: 'L', dimension: 'volume', factor: 1000, aliases: ['liter', 'litre', 'liters', 'litres', 'ltr', 'lt'] },
    { id: 'pinch', label: 'pinch', dimension: 'volume', factor: 0.30806, aliases: ['pinches'] },
    { id: 'dash', label: 'dash', dimension: 'volume', factor: 0.61612, aliases: ['dashes'] },
    { id: 'tsp', label: 'tsp', dimension: 'volume', factor: 4.92892, aliases: ['teaspoon', 'teaspoons', 'tsps', 'tspn'] },
    { id: 'tbsp', label: 'tbsp', dimension: 'volume', factor: 14.7868, aliases: ['tablespoon', 'tablespoons', 'tbs', 'tbl', 'tblsp', 'tbsps'] },
    { id: 'floz', label: 'fl oz', dimension: 'volume', factor: 29.5735, aliases: ['fl oz', 'fluid ounce', 'fluid ounces', 'fl ozs'] },
    { id: 'cup', label: 'cup', dimension: 'volume', factor: 236.588, aliases: ['cups', 'cp'] },
    { id: 'pt', label: 'pint', dimension: 'volume', factor: 473.176, aliases: ['pint', 'pints', 'pts'] },
    { id: 'qt', label: 'quart', dimension: 'volume', factor: 946.353, aliases: ['quart', 'quarts', 'qts'] },
    { id: 'gal', label: 'gallon', dimension: 'volume', factor: 3785.41, aliases: ['gallon', 'gallons', 'gals'] },

    // Count — each count unit is its own island; a "pack" is not a "clove".
    { id: 'pc', label: 'pc', dimension: 'count', factor: 1, aliases: ['piece', 'pieces', 'pcs', 'ea', 'each', 'unit', 'units', 'item', 'items', 'no', 'nos'] },
    { id: 'pack', label: 'pack', dimension: 'count', factor: 1, aliases: ['packs', 'packet', 'packets', 'pkt', 'pkts', 'pkg', 'package', 'packages'] },
    { id: 'can', label: 'can', dimension: 'count', factor: 1, aliases: ['cans', 'tin', 'tins'] },
    { id: 'bunch', label: 'bunch', dimension: 'count', factor: 1, aliases: ['bunches'] },
    { id: 'clove', label: 'clove', dimension: 'count', factor: 1, aliases: ['cloves'] },
    { id: 'slice', label: 'slice', dimension: 'count', factor: 1, aliases: ['slices'] },
];

const BY_ALIAS: Record<string, UnitDef> = {};
for (const u of UNITS) {
    BY_ALIAS[u.id] = u;
    BY_ALIAS[u.label.toLowerCase()] = u;
    for (const a of u.aliases) BY_ALIAS[a] = u;
}

const clean = (raw: string) =>
    raw.toLowerCase().trim().replace(/\./g, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

/** Resolve any spelling of a unit to its definition. Returns null if unrecognized. */
export const getUnit = (raw?: string | null): UnitDef | null => {
    if (!raw) return null;
    const key = clean(raw);
    if (!key) return null;
    if (BY_ALIAS[key]) return BY_ALIAS[key];
    // last resort: a stray plural we don't have an alias for
    const singular = key.replace(/s$/, '');
    return BY_ALIAS[singular] || null;
};

/** Canonical id for any spelling, or null when the unit is unknown. */
export const normalizeUnit = (raw?: string | null): string | null => getUnit(raw)?.id ?? null;

/** Canonical id when we recognize it, otherwise the original string untouched. */
export const normalizeUnitLoose = (raw?: string | null): string => normalizeUnit(raw) ?? (raw || '');

export const unitLabel = (raw?: string | null): string => getUnit(raw)?.label ?? (raw || '');

export const unitDimension = (raw?: string | null): Dimension | null => getUnit(raw)?.dimension ?? null;

export const isKnownUnit = (raw?: string | null): boolean => getUnit(raw) !== null;

/** True when a quantity in `from` can be expressed in `to` without extra information. */
export const canConvert = (from?: string | null, to?: string | null): boolean => {
    const a = getUnit(from);
    const b = getUnit(to);
    if (!a || !b) return false;
    if (a.id === b.id) return true;
    // Counting units are not interchangeable, and mass <-> volume needs a density.
    if (a.dimension === 'count' || b.dimension === 'count') return false;
    return a.dimension === b.dimension;
};

/**
 * Convert between units. Returns null when the conversion is not defined
 * (unknown unit, mass <-> volume, or two different counting units) so callers
 * can ask the user instead of silently producing a wrong number.
 */
export const tryConvertUnit = (quantity: number, from?: string | null, to?: string | null): number | null => {
    const a = getUnit(from);
    const b = getUnit(to);
    if (!a || !b) return null;
    if (a.id === b.id) return quantity;
    if (!canConvert(a.id, b.id)) return null;
    return (quantity * a.factor) / b.factor;
};

/** Convert, falling back to the original quantity when the conversion is undefined. */
export const convertUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
    const safe = Number.isFinite(quantity) ? quantity : 0;
    const converted = tryConvertUnit(safe, fromUnit, toUnit);
    return converted === null ? safe : converted;
};

/** Units a quantity in `unit` can be displayed as. Falls back to everything for unknown units. */
export const convertibleUnits = (unit?: string | null): UnitDef[] => {
    const def = getUnit(unit);
    if (!def) return UNITS;
    if (def.dimension === 'count') return [def];
    return UNITS.filter(u => u.dimension === def.dimension);
};

export const UNIT_GROUPS: { label: string; dimension: Dimension; units: UnitDef[] }[] = [
    { label: 'Weight', dimension: 'mass', units: UNITS.filter(u => u.dimension === 'mass') },
    { label: 'Volume', dimension: 'volume', units: UNITS.filter(u => u.dimension === 'volume') },
    { label: 'Count', dimension: 'count', units: UNITS.filter(u => u.dimension === 'count') },
];

export const AVAILABLE_UNITS: string[] = UNITS.map(u => u.id);

/**
 * How many pantry base units one recipe unit is worth.
 *
 * Order of preference:
 *  1. `baseUnitPerUnit` — an override on this one recipe line.
 *  2. The unit table, when both units measure the same thing.
 *  3. `conversions` from the pantry item — "1 pc of this ingredient is 150 g",
 *     stated once in inventory and reused by every recipe.
 *
 * Returns null when none of those apply, so callers can ask instead of guess.
 */
export const baseUnitRatio = (
    ing: { unit?: string; baseUnitPerUnit?: number },
    baseUnit?: string,
    conversions?: Record<string, number>
): number | null => {
    if (typeof ing.baseUnitPerUnit === 'number' && Number.isFinite(ing.baseUnitPerUnit) && ing.baseUnitPerUnit > 0) {
        return ing.baseUnitPerUnit;
    }

    const direct = tryConvertUnit(1, ing.unit, baseUnit);
    if (direct !== null) return direct;

    if (conversions) {
        const canonical = normalizeUnit(ing.unit);
        const stated = (canonical && conversions[canonical]) ?? (ing.unit ? conversions[ing.unit] : undefined);
        if (typeof stated === 'number' && Number.isFinite(stated) && stated > 0) return stated;
    }

    return null;
};

// --- Quantity parsing / formatting ----------------------------------------

const UNICODE_FRACTIONS: Record<string, number> = {
    '¼': 0.25, '½': 0.5, '¾': 0.75,
    '⅐': 1 / 7, '⅑': 1 / 9, '⅒': 0.1,
    '⅓': 1 / 3, '⅔': 2 / 3,
    '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
    '⅙': 1 / 6, '⅚': 5 / 6,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

/**
 * Parse what a cook actually types: "1.5", "1 1/2", "3/4", "1½", "½".
 * Returns null for anything unparseable so the caller can keep the raw text.
 */
export const parseQuantity = (input: string | number | null | undefined): number | null => {
    if (typeof input === 'number') return Number.isFinite(input) ? input : null;
    if (input === null || input === undefined) return null;

    let text = String(input).trim();
    if (!text) return null;

    // "1½" / "½"
    const uni = text.match(/^(\d+(?:\.\d+)?)?\s*([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
    if (uni) {
        const whole = uni[1] ? parseFloat(uni[1]) : 0;
        return whole + UNICODE_FRACTIONS[uni[2]];
    }

    // "1 1/2"
    const mixed = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
        const den = parseInt(mixed[3], 10);
        if (den === 0) return null;
        return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / den;
    }

    // "3/4"
    const frac = text.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (frac) {
        const den = parseFloat(frac[2]);
        if (!den) return null;
        return parseFloat(frac[1]) / den;
    }

    const num = Number(text);
    return Number.isFinite(num) ? num : null;
};

const FRACTION_GLYPHS: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.375, '⅜'], [0.5, '½'],
    [0.625, '⅝'], [2 / 3, '⅔'], [0.75, '¾'], [0.875, '⅞'],
];

// Units a cook thinks about in halves and quarters rather than decimals.
const FRACTION_FRIENDLY = new Set(['tsp', 'tbsp', 'cup', 'pt', 'qt', 'gal', 'floz', 'lb', 'pinch', 'dash', 'pc', 'pack', 'can', 'bunch', 'clove', 'slice']);

const trimNumber = (n: number): string => {
    const abs = Math.abs(n);
    const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
    return parseFloat(n.toFixed(decimals)).toLocaleString();
};

/** Human-readable quantity: "1½ cup" style for spoons and cups, decimals for grams. */
export const formatQuantity = (value: number, unit?: string | null): string => {
    if (!Number.isFinite(value)) return '0';
    const def = getUnit(unit);
    if (def && FRACTION_FRIENDLY.has(def.id) && Math.abs(value) < 1000) {
        const whole = Math.floor(Math.abs(value));
        const rest = Math.abs(value) - whole;
        const glyph = FRACTION_GLYPHS.find(([v]) => Math.abs(rest - v) < 0.011);
        if (glyph && (whole > 0 || rest > 0)) {
            const sign = value < 0 ? '-' : '';
            return `${sign}${whole > 0 ? whole : ''}${glyph[1]}`;
        }
        if (rest < 0.011) return `${value < 0 ? '-' : ''}${whole}`;
    }
    return trimNumber(value);
};

/** Quantity plus unit label, e.g. "1½ cup" or "250 g". */
export const formatMeasure = (value: number, unit?: string | null): string =>
    `${formatQuantity(value, unit)} ${unitLabel(unit)}`.trim();

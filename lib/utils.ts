
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Currency Logic ---
let currentCurrency = 'USD';
try {
  currentCurrency = localStorage.getItem('chef_currency') || 'USD';
} catch (e) {
  console.warn('LocalStorage access denied', e);
}

// Create formatter instance
let currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: currentCurrency,
});

export const setGlobalCurrency = (currency: string) => {
  currentCurrency = currency;
  try {
      localStorage.setItem('chef_currency', currency);
  } catch (e) {
      console.warn('LocalStorage access denied', e);
  }
  currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currentCurrency,
  });
};

export const getGlobalCurrency = () => currentCurrency;

export const formatCurrency = (amount: number) => {
  if (isNaN(amount) || amount === null || amount === undefined) return currencyFormatter.format(0);
  return currencyFormatter.format(amount);
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export const formatDate = (date: Date) => {
  return dateFormatter.format(date);
};

// Shared Animation Variants
export const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  },
  item: {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: 'spring', stiffness: 100 } 
    }
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 }
  }
} as const;

// --- Unit Conversion Logic ---

// Constants defined outside function to optimize memory
const RATES: Record<string, number> = {
  // Mass (base: g)
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
  // Volume (base: ml)
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588, // US Cup
  // Counting
  piece: 1,
  pcs: 1,
  pack: 1,
};

const TYPE_MAP: Record<string, 'mass' | 'volume' | 'count'> = {
  g: 'mass', kg: 'mass', oz: 'mass', lb: 'mass',
  ml: 'volume', l: 'volume', tsp: 'volume', tbsp: 'volume', cup: 'volume',
  piece: 'count', pcs: 'count', pack: 'count'
};

export const convertUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
  if (!fromUnit || !toUnit) return quantity || 0;
  
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();

  if (from === to) return quantity;

  const typeFrom = TYPE_MAP[from] || 'count';
  const typeTo = TYPE_MAP[to] || 'count';

  // Direct conversion if types match
  if (typeFrom === typeTo && RATES[from] && RATES[to]) {
    const baseQty = quantity * RATES[from];
    return baseQty / RATES[to];
  }

  // Cross-type conversion (Simplified assumption: 1 g ~= 1 ml for water-based)
  if ((typeFrom === 'mass' && typeTo === 'volume') || (typeFrom === 'volume' && typeTo === 'mass')) {
     const baseQty = quantity * (RATES[from] || 1); // g or ml
     return baseQty / (RATES[to] || 1);
  }

  // Cannot convert
  return quantity; 
};

export const AVAILABLE_UNITS = Object.keys(RATES);

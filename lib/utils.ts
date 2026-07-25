
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
// Lives in ./units.ts; re-exported here so existing imports keep working.
export {
  UNITS,
  UNIT_GROUPS,
  AVAILABLE_UNITS,
  convertUnit,
  tryConvertUnit,
  canConvert,
  convertibleUnits,
  getUnit,
  normalizeUnit,
  normalizeUnitLoose,
  unitLabel,
  unitDimension,
  isKnownUnit,
  baseUnitRatio,
  parseQuantity,
  formatQuantity,
  formatMeasure,
} from './units';
export type { Dimension, UnitDef } from './units';

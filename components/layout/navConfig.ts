import { Home, UtensilsCrossed, Warehouse, ClipboardList, ChefHat, BarChart3, Settings, ShoppingCart, LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

// Single source of truth for primary navigation (friendly, food-oriented names).
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
  { to: '/cooking', icon: ChefHat, label: 'Cooking' },
  { to: '/pantry', icon: Warehouse, label: 'Inventory' },
  { to: '/shopping', icon: ShoppingCart, label: 'Shopping' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/analytics', icon: BarChart3, label: 'Insights' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

// Most-used sections for the mobile bottom bar (5 max).
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
  { to: '/cooking', icon: ChefHat, label: 'Cooking' },
  { to: '/pantry', icon: Warehouse, label: 'Inventory' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
];

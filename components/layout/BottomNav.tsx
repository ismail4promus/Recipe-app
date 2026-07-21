import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, ChefHat, Warehouse, UtensilsCrossed } from 'lucide-react';
import { cn } from '../../lib/utils';

// Reference style: dark bar with a raised orange circular center action.
// Center = Home; two nav items flank each side.
const SIDE = [
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/cooking', icon: ChefHat, label: 'Cooking' },
  { to: '/pantry', icon: Warehouse, label: 'Inventory' },
  { to: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
];

const SideLink: React.FC<{ to: string; icon: typeof Home; label: string }> = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        'flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 transition-colors',
        isActive ? 'text-app-primary' : 'text-app-muted hover:text-app-text'
      )
    }
  >
    {({ isActive }) => (
      <>
        <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.9} />
        <span className="text-[10px] font-semibold">{label}</span>
      </>
    )}
  </NavLink>
);

const BottomNav: React.FC = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
    <div className="relative mx-auto flex max-w-lg items-end justify-around border-t border-app-border bg-app-sidebar/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl">
      <SideLink {...SIDE[0]} />
      <SideLink {...SIDE[1]} />

      {/* Center floating action → Home */}
      <div className="flex w-[64px] shrink-0 justify-center">
        <NavLink
          to="/dashboard"
          aria-label="Home"
          className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-app-primary text-primary-foreground shadow-float ring-4 ring-app-sidebar transition-transform active:scale-95"
        >
          <Home className="h-6 w-6" strokeWidth={2.4} />
        </NavLink>
      </div>

      <SideLink {...SIDE[2]} />
      <SideLink {...SIDE[3]} />
    </div>
  </nav>
);

export default BottomNav;

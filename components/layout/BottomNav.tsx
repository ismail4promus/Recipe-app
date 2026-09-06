import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, ChefHat, Warehouse, UtensilsCrossed } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BOTTOM_NAV_ITEMS } from './navConfig';

const ICONS = { Home, ClipboardList, ChefHat, Warehouse, UtensilsCrossed };

// Soft bottom bar: line icons, muted inactive, forest-green active sitting in
// a rounded pill.
const BottomNav: React.FC = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-app-border bg-app-card shadow-float pb-safe md:hidden">
    <div className="flex h-[62px] items-stretch justify-around px-2">
      {BOTTOM_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150',
              isActive ? 'text-app-primary' : 'text-app-faint hover:text-app-text'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span aria-hidden className="absolute inset-x-2 inset-y-1.5 rounded-2xl bg-app-primary/10" />}
              <Icon className="relative h-[21px] w-[21px]" strokeWidth={isActive ? 2.4 : 1.8} />
              <span className={cn('relative text-[10px] tracking-tight', isActive ? 'font-bold' : 'font-medium')}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;

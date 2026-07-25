import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, ChefHat, Warehouse, UtensilsCrossed } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BOTTOM_NAV_ITEMS } from './navConfig';

const ICONS = { Home, ClipboardList, ChefHat, Warehouse, UtensilsCrossed };

// Flat, minimal bottom bar (reference style): line icons, muted inactive,
// teal active with a thin indicator line above the selected tab.
const BottomNav: React.FC = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-app-border bg-app-sidebar pb-safe md:hidden">
    <div className="flex h-[58px] items-stretch justify-around">
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
              {isActive && <span className="absolute top-0 left-0 right-0 h-[2px] bg-app-primary" />}
              <Icon className="h-[21px] w-[21px]" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium tracking-tight">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;

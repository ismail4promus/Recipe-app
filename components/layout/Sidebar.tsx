import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChefHat, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NAV_ITEMS } from './navConfig';

// Desktop: full labels. Tablet (md–lg): auto-collapsed to icons only.
const Sidebar: React.FC = () => {
  const [kitchenName, setKitchenName] = useState('iKitchen');

  useEffect(() => {
    const stored = localStorage.getItem('chef_kitchen_name');
    if (stored) setKitchenName(stored);
  }, []);

  return (
    <aside className="hidden md:flex flex-col md:w-[76px] lg:w-[248px] h-full bg-app-sidebar border-r border-app-border relative z-30 transition-[width] duration-200">
      <div className="flex items-center gap-3 px-4 lg:px-5 h-[68px] border-b border-app-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-primary text-primary-foreground">
          <ChefHat className="h-5 w-5" />
        </div>
        <h1 className="hidden lg:block truncate text-lg font-bold tracking-tight text-app-text">{kitchenName}</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 lg:px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors md:justify-center lg:justify-start',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60',
                isActive
                  ? 'bg-app-primary/12 text-app-primary font-semibold'
                  : 'text-app-muted hover:bg-white/[0.04] hover:text-app-text'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('absolute left-0 top-1/2 hidden h-6 -translate-y-1/2 rounded-r-full bg-app-primary transition-all lg:block', isActive ? 'w-1' : 'w-0')} />
                <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.4 : 2} />
                <span className="hidden lg:inline text-sm">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg border border-app-border bg-app-card p-3 md:justify-center lg:justify-start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-app-muted">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="truncate text-sm font-semibold text-app-text">Kitchen Owner</p>
            <p className="truncate text-xs text-app-muted">Signed in</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChefHat, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from './navConfig';

// Desktop: full labels. Tablet (md–lg): auto-collapsed to icons only.
const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [kitchenName, setKitchenName] = useState('iCooking');

  useEffect(() => {
    const stored = localStorage.getItem('chef_kitchen_name');
    if (stored) setKitchenName(stored);
  }, []);

  return (
    <aside className="hidden md:flex flex-col md:w-[76px] lg:w-[224px] h-full bg-app-sidebar border-r border-app-border relative z-30 transition-[width] duration-200">
      <div className="flex items-center gap-3 px-4 lg:px-5 h-14 border-b border-app-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-app-primary text-primary-foreground">
          <ChefHat className="h-5 w-5" />
        </div>
        <h1 className="hidden lg:block truncate text-lg font-bold tracking-tight text-app-text">{kitchenName}</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-2 lg:px-2.5 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors md:justify-center lg:justify-start',
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

      {/* Reflects the real session — this used to read "Signed in" even when
          signed out, which hid the reason data was not saving. */}
      <div className="p-2">
        <Link
          to={user ? '/settings' : '/signin'}
          className="flex items-center gap-2.5 border border-app-border bg-app-card p-2 transition-colors hover:border-app-primary/40 md:justify-center lg:justify-start"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-app-border bg-app-elevated text-app-muted">
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              : <User className="h-4 w-4" />}
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="truncate text-[13px] font-semibold text-app-text">
              {user ? (user.displayName || 'Signed in') : 'Not signed in'}
            </p>
            <p className={cn('truncate text-[11px]', user ? 'text-app-muted' : 'text-app-warning font-medium')}>
              {user ? (user.email || 'Signed in') : 'Sign in to save your data'}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, Warehouse, ClipboardList, BarChart2, Settings, ChefHat, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const navLinks = [
  { to: '/dashboard', icon: Home, label: 'Overview' },
  { to: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
  { to: '/pantry', icon: Warehouse, label: 'Inventory' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/analytics', icon: BarChart2, label: 'Insights' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar: React.FC = () => {
    const [kitchenName, setKitchenName] = useState('iKITCHEN');

    useEffect(() => {
        const storedKitchen = localStorage.getItem('chef_kitchen_name');
        if (storedKitchen) setKitchenName(storedKitchen);
    }, []);

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-full bg-app-sidebar border-r border-app-border relative z-30">
      <div className="flex items-center gap-3 px-6 h-[70px] border-b border-app-border">
         <div className="flex items-center justify-center h-8 w-8 rounded-sm bg-app-primary text-white shrink-0">
            <ChefHat className="w-5 h-5" />
         </div>
         <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tighter text-app-text leading-none truncate uppercase">{kitchenName}</h1>
         </div>
      </div>

      <nav className="flex-1 flex flex-col pt-6 overflow-y-auto">
        <p className="px-6 tactical-label mb-4 opacity-60">Tactical Menu</p>
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-4 px-6 py-4 transition-all duration-200 group border-l-4',
                isActive 
                    ? 'border-app-primary bg-white/5 text-app-primary' 
                    : 'border-transparent text-app-muted hover:bg-white/5 hover:text-app-text'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="relative h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-app-bg p-4 rounded-md border border-app-border flex items-center gap-3 group cursor-pointer hover:border-app-primary transition-all">
            <div className="h-9 w-9 rounded-md bg-app-card flex items-center justify-center border border-app-border shadow-inner shrink-0">
                <User className="h-4 w-4 text-app-muted" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-app-text leading-tight uppercase tracking-tight truncate">Commander</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="status-pulse bg-app-success"></span>
                    <p className="text-[8px] text-app-muted font-bold tracking-widest uppercase truncate leading-none">Duty Active</p>
                </div>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
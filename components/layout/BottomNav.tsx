import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, Warehouse, ClipboardList, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const navLinks = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
  { to: '/pantry', icon: Warehouse, label: 'Pantry' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const BottomNav: React.FC = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      <nav className="bg-background/95 backdrop-blur-xl border-t border-border/50 pb-safe transition-all duration-300">
        <div className="flex items-center justify-around px-2 py-2">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                "relative flex flex-col items-center justify-center w-full py-1 gap-1 transition-all duration-300",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-indicator"
                        className="absolute -inset-2 bg-primary/10 rounded-full z-0 blur-[2px]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={cn("h-5 w-5 relative z-10 transition-all duration-300", isActive ? "fill-primary/20 scale-110 drop-shadow-[0_0_5px_rgba(29,185,84,0.3)]" : "")} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest relative z-10 transition-all duration-300", isActive ? "text-primary scale-105" : "text-muted-foreground/60")}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
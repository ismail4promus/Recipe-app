import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ChefHat, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { NAV_ITEMS } from './navConfig';

// Slide-out menu for mobile — full nav incl. secondary items (Insights, Settings).
const MobileDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="absolute left-0 top-0 flex h-full w-[280px] flex-col bg-app-sidebar border-r border-app-border"
          >
            <div className="flex items-center justify-between px-5 h-[68px] border-b border-app-border">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-primary text-primary-foreground">
                  <ChefHat className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-app-text">iCooking</span>
              </div>
              <button onClick={onClose} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-lg text-app-muted hover:bg-white/5 hover:text-app-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
              {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60',
                      isActive ? 'bg-app-primary/12 text-app-primary font-semibold' : 'text-app-muted hover:bg-white/[0.04] hover:text-app-text'
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="p-3">
              <div className="flex items-center gap-3 rounded-lg border border-app-border bg-app-card p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-app-muted">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-app-text">Kitchen Owner</p>
                  <p className="truncate text-xs text-app-muted">Signed in</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;

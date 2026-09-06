import React, { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChefHat, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from './navConfig';

// Slide-out menu for mobile — full nav incl. secondary items (Insights, Settings).
const MobileDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user } = useAuth();
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
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-app-primary text-primary-foreground shadow-soft">
                  <ChefHat className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-app-text">iCooking</span>
              </div>
              <button onClick={onClose} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-full text-app-muted hover:bg-app-muted/10 hover:text-app-text">
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
                      isActive ? 'bg-app-primary/12 text-app-primary font-semibold' : 'text-app-muted hover:bg-app-muted/10 hover:text-app-text'
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="p-2">
              <Link
                to={user ? '/settings' : '/signin'}
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-2xl border border-app-border bg-app-card p-2 shadow-soft"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-app-border bg-app-elevated text-app-muted">
                  {user?.photoURL
                    ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    : <User className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-app-text">
                    {user ? (user.displayName || 'Signed in') : 'Not signed in'}
                  </p>
                  <p className={user ? 'truncate text-[11px] text-app-muted' : 'truncate text-[11px] font-medium text-app-warning'}>
                    {user ? (user.email || 'Signed in') : 'Sign in to save your data'}
                  </p>
                </div>
              </Link>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;

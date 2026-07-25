import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, User, CloudOff, Search, LogIn, LogOut, Settings, Loader2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import GlobalSearch from './GlobalSearch';
import MobileDrawer from './MobileDrawer';

const Header: React.FC = () => {
  const { isDemoMode } = useData();
  const { user, loading, signingIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen]);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    navigate('/signin');
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-app-border bg-app-sidebar/90 px-3 backdrop-blur-md md:px-4">
        {/* Mobile menu */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center text-app-muted hover:bg-app-muted/10 hover:text-app-text md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop / tablet search */}
        <div className="hidden flex-1 md:block md:max-w-md">
          <GlobalSearch />
        </div>

        <div className="flex-1 md:hidden" />

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Connection problem indicator — only when there's a real issue */}
          {isDemoMode && (
            <span className="hidden items-center gap-1.5 border border-app-warning/25 bg-app-warning/10 px-2.5 py-1.5 text-xs font-semibold text-app-warning sm:inline-flex" title="Working offline with local data — changes are not saved">
              <CloudOff className="h-3.5 w-3.5" /> Offline
            </span>
          )}

          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearch(s => !s)}
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center text-app-muted hover:bg-app-muted/10 hover:text-app-text md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center text-app-muted hover:bg-app-muted/10 hover:text-app-text"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 bg-app-primary" />
          </button>

          {/* Signed out: a plain sign-in button. Signed in: avatar + menu. */}
          {!user && !loading ? (
            <Link
              to="/signin"
              className="flex h-9 items-center gap-2 bg-app-primary px-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-105 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                aria-label="Profile"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen(o => !o)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center overflow-hidden border border-app-border bg-app-card text-app-muted transition-colors hover:text-app-text",
                  profileOpen && "border-app-primary text-app-primary"
                )}
              >
                {loading || signingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </button>

              {profileOpen && user && (
                <div role="menu" className="absolute right-0 top-11 z-50 w-60 border border-app-border bg-app-card shadow-card">
                  <div className="flex items-center gap-3 border-b border-app-border p-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden border border-app-border bg-app-elevated flex items-center justify-center">
                      {user.photoURL
                        ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        : <User className="h-5 w-5 text-app-muted" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-app-text">{user.displayName || 'Signed in'}</p>
                      <p className="truncate text-xs text-app-muted">{user.email}</p>
                    </div>
                  </div>

                  <button
                    role="menuitem"
                    onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-app-text transition-colors hover:bg-app-elevated"
                  >
                    <Settings className="h-4 w-4 text-app-muted" /> Settings
                  </button>

                  <button
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 border-t border-app-border px-3 py-2.5 text-sm font-medium text-app-danger transition-colors hover:bg-app-danger/10"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile expandable search row */}
      {mobileSearch && (
        <div className="border-b border-app-border bg-app-bg p-3 md:hidden">
          <GlobalSearch autoFocus onNavigate={() => setMobileSearch(false)} />
        </div>
      )}

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

export default Header;

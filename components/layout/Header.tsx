import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, User, CloudOff, Search, LogIn, LogOut, Settings, Loader2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import GlobalSearch from './GlobalSearch';
import MobileDrawer from './MobileDrawer';
import { buildAlerts } from '../../lib/alerts';

const Header: React.FC = () => {
  const { isDemoMode, ingredients, orders } = useData();
  const { user, loading, signingIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Same derivation the dashboard panel uses, so the badge can never disagree
  // with the list it links to.
  const alerts = useMemo(() => buildAlerts(ingredients, orders), [ingredients, orders]);
  const urgentCount = alerts.filter(a => a.severity === 'urgent').length;

  useEffect(() => {
    if (!profileOpen) return;
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen]);

  useEffect(() => {
    if (!bellOpen) return;
    const close = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setBellOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onEsc);
    };
  }, [bellOpen]);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    navigate('/signin');
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-app-border bg-app-sidebar/85 px-3 backdrop-blur-md md:px-4">
        {/* Mobile menu */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-muted/10 hover:text-app-text md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop / tablet search */}
        <div className="hidden flex-1 md:block md:max-w-md">
          <GlobalSearch showShortcut />
        </div>

        <div className="flex-1 md:hidden" />

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Connection problem indicator — only when there's a real issue */}
          {isDemoMode && (
            <span className="hidden items-center gap-1.5 rounded-full border border-app-warning/25 bg-app-warning/10 px-3 py-1.5 text-xs font-semibold text-app-warning sm:inline-flex" title="Working offline with local data — changes are not saved">
              <CloudOff className="h-3.5 w-3.5" /> Offline
            </span>
          )}

          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearch(s => !s)}
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-muted/10 hover:text-app-text md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications — the dot only appears when something is actually wrong */}
          <div className="relative" ref={bellRef}>
            <button
              aria-label={alerts.length ? `Notifications (${alerts.length})` : 'Notifications'}
              aria-haspopup="menu"
              aria-expanded={bellOpen}
              onClick={() => setBellOpen(o => !o)}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-muted/10 hover:text-app-text',
                bellOpen && 'text-app-text'
              )}
            >
              <Bell className="h-5 w-5" />
              {alerts.length > 0 && (
                <span
                  className={cn(
                    'absolute right-0.5 top-0.5 min-w-[15px] rounded-full px-[4px] text-center text-[9px] font-bold leading-[15px] text-white',
                    urgentCount ? 'bg-app-danger' : 'bg-app-warning'
                  )}
                >
                  {alerts.length > 9 ? '9+' : alerts.length}
                </span>
              )}
            </button>

            {bellOpen && (
              <div role="menu" className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-float">
                <div className="flex items-center justify-between border-b border-app-border px-3 py-2">
                  <p className="text-sm font-semibold text-app-text">Needs attention</p>
                  <span className="text-xs text-app-muted">{alerts.length}</span>
                </div>

                {alerts.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-app-muted">Everything is on track.</p>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto">
                    {alerts.slice(0, 8).map(a => (
                      <button
                        key={a.id}
                        role="menuitem"
                        onClick={() => { setBellOpen(false); navigate(a.to); }}
                        className="flex w-full items-start gap-2.5 border-b border-app-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-app-elevated"
                      >
                        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', a.severity === 'urgent' ? 'bg-app-danger' : 'bg-app-warning')} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-app-text">{a.title}</span>
                          <span className="block text-xs leading-relaxed text-app-muted">{a.message}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  role="menuitem"
                  onClick={() => { setBellOpen(false); navigate('/dashboard'); }}
                  className="w-full border-t border-app-border px-3 py-2 text-xs font-semibold text-app-primary transition-colors hover:bg-app-elevated"
                >
                  Open dashboard
                </button>
              </div>
            )}
          </div>

          {/* Signed out: a plain sign-in button. Signed in: avatar + menu. */}
          {!user && !loading ? (
            <Link
              to="/signin"
              className="flex h-9 items-center gap-2 rounded-full bg-app-primary px-4 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:brightness-110 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/50"
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
                  "flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-app-border bg-app-card text-app-muted transition-colors hover:text-app-text",
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
                <div role="menu" className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-float">
                  <div className="flex items-center gap-3 border-b border-app-border p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-app-border bg-app-elevated">
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

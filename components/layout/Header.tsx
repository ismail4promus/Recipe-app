import React, { useState } from 'react';
import { Menu, Bell, User, CloudOff, Search } from 'lucide-react';
import { useData } from '../../context/DataContext';
import GlobalSearch from './GlobalSearch';
import MobileDrawer from './MobileDrawer';

const Header: React.FC = () => {
  const { isDemoMode } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-app-border bg-app-sidebar/90 px-3 backdrop-blur-md md:px-4">
        {/* Mobile menu */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-app-muted hover:bg-app-muted/10 hover:text-app-text md:hidden"
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
            <span className="hidden items-center gap-1.5 rounded-md border border-app-warning/25 bg-app-warning/10 px-2.5 py-1.5 text-xs font-semibold text-app-warning sm:inline-flex" title="Working offline with local data">
              <CloudOff className="h-3.5 w-3.5" /> Offline
            </span>
          )}

          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearch(s => !s)}
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-md text-app-muted hover:bg-app-muted/10 hover:text-app-text md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-app-muted hover:bg-app-muted/10 hover:text-app-text"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-app-primary" />
          </button>

          <button
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-app-card text-app-muted hover:text-app-text"
          >
            <User className="h-4 w-4" />
          </button>
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

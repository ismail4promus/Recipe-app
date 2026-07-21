import React from 'react';
import { Search, Bell, Activity, Wifi } from 'lucide-react';
import { cn } from '../../lib/utils';

const Header: React.FC = () => {
  return (
    <header className="flex h-[70px] items-center justify-between border-b border-app-border px-6 z-20 sticky top-0 bg-app-bg/80 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4 border-r border-app-border pr-6 h-10">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-app-success animate-pulse shadow-[0_0_8px_rgba(28,187,140,0.5)]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-app-text">Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-3 w-3 text-app-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-app-muted">Synced</span>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-app-bg rounded-sm px-4 h-10 w-80 border border-white/10 focus-within:border-app-primary transition-all">
            <Search className="h-3.5 w-3.5 text-app-muted mr-3" />
            <input 
                type="text" 
                placeholder="SEARCH DATABASE..." 
                className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest w-full placeholder:text-app-muted/30"
            />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="h-10 w-10 flex items-center justify-center rounded-sm bg-app-card border border-app-border text-app-muted hover:text-app-text transition-all relative group">
             <Bell className="h-4 w-4 group-hover:scale-110 transition-transform" />
             <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-app-warning rounded-full shadow-[0_0_5px_#fcb92c]"></span>
        </button>
        
        <div className="h-10 w-px bg-app-border mx-2"></div>
        
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-app-text tracking-widest leading-none">v1.2.0</span>
            <span className="text-[8px] font-bold text-app-muted uppercase tracking-tighter mt-1">LATEST STABLE</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
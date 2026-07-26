import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import SaveStatusBanner from './SaveStatusBanner';
import CommandPalette from './CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="app-shell-bg flex h-screen w-full text-app-text">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Header />
        <SaveStatusBanner />

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto pb-nav md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-2 md:p-3 lg:p-4 max-w-[1600px] mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>

      {/* Cmd/Ctrl-K from anywhere inside the app shell */}
      <CommandPalette />
    </div>
  );
};

export default Layout;
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

type Mode = 'light' | 'dark';

interface ThemeContextType {
  theme: Mode;
  setTheme: (theme: Mode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'icooking-theme';

const getInitial = (): Mode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch { /* ignore */ }
  return 'light';
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Mode>(getInitial);

  useEffect(() => {
    const root = window.document.documentElement;
    // Apply an explicit class so it wins over the prefers-color-scheme fallback.
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = useCallback((t: Mode) => setThemeState(t === 'dark' ? 'dark' : 'light'), []);
  const toggleTheme = useCallback(() => setThemeState(t => (t === 'dark' ? 'light' : 'dark')), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

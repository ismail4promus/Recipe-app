import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

type Mode = 'light' | 'dark';

interface ThemeContextType {
  theme: Mode;
  setTheme: (theme: Mode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitial = (): Mode => {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* ignore */ }
  return 'dark'; // dark is the default look (matches the reference design)
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Mode>(getInitial);

  useEffect(() => {
    const root = window.document.documentElement;
    // :root defaults to dark; adding `light` switches the palette.
    root.classList.toggle('light', theme === 'light');
    root.classList.remove('ocean', 'sunset', 'rose', 'forest');
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = useCallback((t: Mode) => setThemeState(t === 'light' ? 'light' : 'dark'), []);
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

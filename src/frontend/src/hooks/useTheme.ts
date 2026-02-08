import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'app-theme';
const DEFAULT_THEME: Theme = 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Read from localStorage on initial load
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    return DEFAULT_THEME;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Update color-scheme for native browser elements
    root.style.colorScheme = theme;
    
    // Persist to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return {
    theme,
    setTheme,
  };
}

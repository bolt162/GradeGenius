'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with 'dark' as the default theme and only update from localStorage on the client side
  const [theme, setTheme] = useState<Theme>('dark');
  // Track whether we've initialized from localStorage yet
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only run on the client side
    if (typeof window !== 'undefined') {
      // Check if theme was previously saved
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    // Only update document and localStorage after we've initialized
    // to prevent hydration mismatch
    if (isInitialized && typeof window !== 'undefined') {
      // Update data-theme attribute on document when theme changes
      document.documentElement.setAttribute('data-theme', theme);
      
      // Save theme preference to localStorage
      localStorage.setItem('theme', theme);
    }
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 
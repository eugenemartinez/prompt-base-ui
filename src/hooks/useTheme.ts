import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const useTheme = (defaultTheme: Theme = 'dark') => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Check localStorage first
    try {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }
    } catch (error) {
      console.error("Error reading localStorage:", error);
    }

    // 2. Check OS preference if no stored theme
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 3. Return OS preference or default
    return prefersDark ? 'dark' : defaultTheme;
  });

  // Effect to apply class to HTML element and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error("Error saving theme to localStorage:", error);
    }
  }, [theme]);

  // Function to toggle the theme
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
};

export default useTheme;

import React, { ReactNode } from 'react'; // Removed createContext
import useTheme from '../hooks/useTheme';
import { ThemeContext } from '../contexts/ThemeContext'; // Import context from its own file

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}

// Now ONLY exports the component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark',
}) => {
  const themeState = useTheme(defaultTheme);

  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  );
};
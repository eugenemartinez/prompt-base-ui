import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext'; // Import context from its own file

// Custom hook to use the ThemeContext
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
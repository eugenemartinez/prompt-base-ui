import { createContext } from 'react';
import useTheme from '../hooks/useTheme'; // Adjust path if needed

// Define the type based on the hook's return type
export type ThemeContextType = ReturnType<typeof useTheme>;

// Create and export the context
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
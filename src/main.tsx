import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import TanStack Query
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './providers/ThemeProvider'; // Import the ThemeProvider

// Create a client instance
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Provide the client to your App */}
    <QueryClientProvider client={queryClient}>
      {/* Wrap App with BrowserRouter */}
      <BrowserRouter>
        {/* Wrap with ThemeProvider, defaulting to dark */}
        <ThemeProvider defaultTheme="dark">
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

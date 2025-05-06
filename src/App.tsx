import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import HomePage from './pages/HomePage';
import VaultPage from './pages/VaultPage';
// --- Import Header ---
import Header from './components/Header';
// --- End Import ---

function App() {
  return (
    // Main container - bg-background is applied via body in index.css
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {/* Max-width container */}
      <div className="w-full max-w-7xl">
        {/* --- Add Toaster Component --- */}
        <Toaster
          position="top-right" // Or your preferred position
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            // --- Apply theme-aware styling using CSS variables ---
            style: {
              background: 'var(--card)', // Use card background
              color: 'var(--card-foreground)', // Use card text color
              border: '1px solid var(--border)', // Use border color
            },
            // --- End styling ---
          }}
        />
        {/* --- End Toaster --- */}

        {/* --- Use Header Component --- */}
        <Header />
        {/* --- End Use --- */}

        {/* Main Content Area */}
        <main>
          {/* Define Routes */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/vault" element={<VaultPage />} />
            {/* <Route path="/prompt/:id" element={<PromptDetailPage />} /> */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {/* Footer Section */}
        {/* Use muted foreground color for footer text */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PromptBase. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

// Optional: Simple 404 component
function NotFoundPage() {
  // Use muted foreground for 404 text
  return <div className="text-center text-muted-foreground"><h2>404 - Page Not Found</h2></div>;
}

export default App;

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useThemeContext } from '../hooks/useThemeContext';
import { Button } from './common/Button';
import {
  BsSun,
  BsMoon,
  BsJournalCode,
  BsList,
  BsX,
  BsHouseDoor,
  BsSafe,
  BsInfoCircle, // <-- Import Info icon
} from 'react-icons/bs';

function Header() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme, toggleTheme } = useThemeContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  const getLinkClass = (path: string, isMobile: boolean = false) => {
    const baseClass = `transition-colors flex items-center gap-2 ${isMobile ? 'block py-2 px-3 rounded w-full' : ''}`;
    const activeClass = `text-primary font-medium ${isMobile ? 'bg-primary/10' : ''}`;
    const inactiveClass = `text-muted-foreground hover:text-primary ${isMobile ? 'hover:bg-accent' : ''}`;
    return `${baseClass} ${currentPath === path ? activeClass : inactiveClass}`;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        hamburgerButtonRef.current &&
        !hamburgerButtonRef.current.contains(event.target as Node)
      ) {
        closeMobileMenu();
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="relative mb-8 flex flex-wrap justify-between items-center gap-4 border-b pb-4">
      {/* Title Link */}
      <Link
        to="/"
        className="flex items-center gap-2 text-2xl font-bold text-foreground hover:text-primary transition-colors"
        onClick={closeMobileMenu}
      >
        <BsJournalCode className="h-6 w-6" />
        <span>PromptBase</span>
      </Link>

      {/* Desktop Navigation & Theme Toggle */}
      <div className="hidden md:flex items-center gap-4">
        <nav className="flex items-center space-x-4">
          <Link to="/" className={getLinkClass('/')}>
            <BsHouseDoor className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link to="/vault" className={getLinkClass('/vault')}>
            <BsSafe className="h-5 w-5" />
            <span>My Vault</span>
          </Link>
          {/* --- Add About Link (Desktop) --- */}
          <Link to="/about" className={getLinkClass('/about')}>
            <BsInfoCircle className="h-5 w-5" />
            <span>About</span>
          </Link>
          {/* --- End Add --- */}
        </nav>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <BsMoon className="h-5 w-5" /> : <BsSun className="h-5 w-5" />}
        </Button>
      </div>

      {/* Hamburger Button */}
      <div className="md:hidden">
        {/* --- Assign ref to the button --- */}
        <Button
          ref={hamburgerButtonRef} // Assign ref here
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <BsX className="h-6 w-6" /> : <BsList className="h-6 w-6" />}
        </Button>
        {/* --- End Assign --- */}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        // --- Assign ref to the menu container ---
        <div
          ref={mobileMenuRef} // Assign ref here
          className="absolute top-full left-0 right-0 z-20 md:hidden bg-card border-b shadow-md rounded-b-lg"
        >
        {/* --- End Assign --- */}
          <nav className="flex flex-col p-4 space-y-1">
            <Link to="/" className={getLinkClass('/', true)} onClick={closeMobileMenu}>
              <BsHouseDoor className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link to="/vault" className={getLinkClass('/vault', true)} onClick={closeMobileMenu}>
              <BsSafe className="h-5 w-5" />
              <span>My Vault</span>
            </Link>
            {/* --- Add About Link (Mobile) --- */}
            <Link to="/about" className={getLinkClass('/about', true)} onClick={closeMobileMenu}>
              <BsInfoCircle className="h-5 w-5" />
              <span>About</span>
            </Link>
            {/* --- End Add --- */}
            <div className="pt-2 mt-2 border-t">
              <Button
                variant="ghost"
                onClick={() => { toggleTheme(); closeMobileMenu(); }}
                className="w-full justify-start gap-2"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <BsMoon className="h-5 w-5" /> : <BsSun className="h-5 w-5" />}
                <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
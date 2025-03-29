
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, MenuIcon, X, Home, BarChart2, PiggyBank, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen, isMobile]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <Home size={18} /> },
    { name: 'Budget', path: '/budget', icon: <BarChart2 size={18} /> },
    { name: 'Savings', path: '/savings', icon: <PiggyBank size={18} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart size={18} /> },
  ];

  return (
    <header 
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              className="flex items-center gap-2 font-semibold text-lg transition-opacity duration-200 hover:opacity-80"
              onClick={closeMenu}
            >
              <div className="relative w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-lg bg-primary opacity-20"></span>
                G
              </div>
              <span>Gatsby</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`group flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-foreground/80 hover:bg-secondary'
                }`}
              >
                <span className="flex items-center justify-center">{link.icon}</span>
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation Toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X /> : <MenuIcon />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobile && (
        <div
          className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="container h-full flex flex-col">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  FT
                </div>
                <span className="font-semibold text-lg">Intern Finance</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <X />
              </Button>
            </div>
            <nav className="flex flex-col mt-8 space-y-2">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${
                    location.pathname === link.path 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-secondary'
                  }`}
                  onClick={closeMenu}
                >
                  <span className="flex items-center justify-center">{link.icon}</span>
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

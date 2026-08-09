import { Link } from "@tanstack/react-router";
import { Search, Sun, Moon, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-500 ${isScrolled ? 'bg-background/80 backdrop-blur-md shadow-md border-b' : 'bg-transparent border-b border-white/10'}`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary tracking-tight">
          <span className="animate-float">🐝</span>
          <span className={!isScrolled ? 'text-white dark:text-foreground' : ''}>StudyHive</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 font-semibold">
          <Link to="/" className={`relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full ${!isScrolled ? 'text-white/80 hover:text-white' : 'text-primary hover:text-primary/80'} transition-colors`}>Home</Link>
          <Link 
            to="/" 
            search={{ scrollTo: 'subjects' }}
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                document.getElementById("browse-subjects")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className={`relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full ${!isScrolled ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-primary'} transition-colors`}
          >
            Subjects
          </Link>
          <Link to="/search" className={`relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full ${!isScrolled ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-primary'} transition-colors`}>Search</Link>
          <Link to="/upload" className={`relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full ${!isScrolled ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-primary'} transition-colors`}>Upload</Link>
          <Link to="/admin" className={`relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full ${!isScrolled ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-primary'} transition-colors`}>Admin</Link>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDark}
            className={`p-2 rounded-full transition-all duration-500 hover:rotate-180 ${!isScrolled ? 'text-white hover:bg-white/10' : 'text-primary hover:bg-muted'}`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <Link 
            to="/upload"
            className="hidden sm:block bg-secondary text-primary font-bold px-6 py-2 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-yellow-400/30 animate-pulse hover:animate-none"
          >
            Upload
          </Link>

          <button 
            className="md:hidden p-2 text-primary" 
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl md:hidden transition-transform duration-300 animate-in slide-in-from-right">
          <div className="flex flex-col h-full p-6">
            <div className="flex justify-between items-center mb-12">
              <span className="text-2xl font-bold text-primary">StudyHive</span>
              <button onClick={() => setIsMenuOpen(false)}><X className="w-8 h-8" /></button>
            </div>
            <div className="flex flex-col gap-6 text-xl font-bold text-primary">
              <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link 
                to="/" 
                search={{ scrollTo: 'subjects' }}
                onClick={(e) => {
                  setIsMenuOpen(false);
                  if (window.location.pathname === "/") {
                    e.preventDefault();
                    document.getElementById("browse-subjects")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Subjects
              </Link>
              <Link to="/search" onClick={() => setIsMenuOpen(false)}>Search</Link>
              <Link to="/upload" onClick={() => setIsMenuOpen(false)}>Upload</Link>
              <Link to="/admin" onClick={() => setIsMenuOpen(false)}>Admin</Link>
              <Link to="/upload" onClick={() => setIsMenuOpen(false)} className="bg-secondary p-4 rounded-lg text-center mt-4">Upload Now</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

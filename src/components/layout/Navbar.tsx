import { Link } from "@tanstack/react-router";
import { Search, Sun, Moon, Menu, X, Palette } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const THEMES = [
  { id: 'default',   name: 'Midnight',   accent: '#fed01b', bg: '#040118', card: '#0f0a2e' },
  { id: 'ocean',     name: 'Ocean',      accent: '#38bdf8', bg: '#020617', card: '#0c1a2e' },
  { id: 'forest',    name: 'Forest',     accent: '#4ade80', bg: '#021207', card: '#0a1f10' },
  { id: 'rose',      name: 'Rose',       accent: '#fb7185', bg: '#1a0010', card: '#2d0020' },
  { id: 'violet',    name: 'Violet',     accent: '#a78bfa', bg: '#0d0520', card: '#1a0a35' },
  { id: 'sunset',    name: 'Sunset',     accent: '#fb923c', bg: '#1a0800', card: '#2d1200' },
  { id: 'cyan',      name: 'Cyber',      accent: '#22d3ee', bg: '#010d14', card: '#021820' },
  { id: 'pink',      name: 'Sakura',     accent: '#f472b6', bg: '#1a0015', card: '#2d0025' },
  { id: 'lime',      name: 'Neon',       accent: '#a3e635', bg: '#0a1000', card: '#141f00' },
  { id: 'gold',      name: 'Royal',      accent: '#fbbf24', bg: '#0f0800', card: '#1f1200' },
]

export function Navbar() {
  const [isDark, setIsDark] = useState(() => typeof window !== 'undefined' && (localStorage.getItem('theme') !== 'light'));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTheme, setActiveTheme] = useState('default');
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  
  const themePanelRef = useRef<HTMLDivElement>(null);

  const applyTheme = (themeId: string) => {
    document.documentElement.setAttribute('data-theme', themeId === 'default' ? '' : themeId);
    localStorage.setItem('studyhive-theme', themeId);
    setActiveTheme(themeId);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('studyhive-theme');
    if (savedTheme) applyTheme(savedTheme);

    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      setIsDark(true);
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (themePanelRef.current && !themePanelRef.current.contains(event.target as Node)) {
        setIsThemePanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

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
    <nav className={`sticky top-0 z-[200] w-full transition-all duration-700 ${
      isScrolled 
        ? 'bg-background/95 backdrop-blur-md shadow-md border-b border-white/5' 
        : 'bg-[#040118]/60 backdrop-blur-sm border-b border-white/10'
    }`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-black text-white tracking-tight">
          <span className="animate-float">🐝</span>
          <span>StudyHive</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 font-semibold">
          <Link to="/" className={`relative transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary after:transition-all after:duration-300 hover:after:w-full ${
            isScrolled ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white'
          }`}>Home</Link>
          <Link 
            to="/" 
            search={{ scrollTo: 'subjects' }}
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                document.getElementById("browse-subjects")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className={`relative transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary after:transition-all after:duration-300 hover:after:w-full ${
              isScrolled ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white'
            }`}
          >
            Subjects
          </Link>
          <Link to="/search" className={`relative transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary after:transition-all after:duration-300 hover:after:w-full ${
            isScrolled ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white'
          }`}>Search</Link>
          <Link to="/upload" className={`relative transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary after:transition-all after:duration-300 hover:after:w-full ${
            isScrolled ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white'
          }`}>Upload</Link>
          <Link to="/admin" className={`relative transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary after:transition-all after:duration-300 hover:after:w-full ${
            isScrolled ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white'
          }`}>Admin</Link>
        </div>

        <div className="flex items-center gap-4 relative z-[200]">
          <div className="relative" ref={themePanelRef}>
            <button 
              onClick={() => setIsThemePanelOpen(!isThemePanelOpen)}
              className={`p-2 rounded-full transition-all duration-200 ${
                isScrolled ? 'text-foreground hover:bg-muted' : 'text-white hover:bg-white/10'
              }`}
              aria-label="Change theme"
            >
              <Palette className="w-5 h-5" />
            </button>
            
            {isThemePanelOpen && (
              <div className="absolute right-0 top-12 glass-card p-4 min-w-[160px] shadow-2xl border border-border bg-card z-50 animate-in fade-in zoom-in duration-200">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-bold">Theme</p>
                <div className="grid grid-cols-5 gap-2">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        applyTheme(theme.id);
                        setIsThemePanelOpen(false);
                      }}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer hover:scale-110 ${activeTheme === theme.id ? 'border-primary scale-110 shadow-lg' : 'border-transparent'}`}
                      style={{ backgroundColor: theme.accent }}
                      title={theme.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={toggleDark}
            className={`p-2 rounded-full transition-all duration-500 hover:rotate-180 ${
              isScrolled ? 'text-foreground hover:bg-muted' : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <Link 
            to="/upload"
            className="hidden sm:block bg-secondary text-secondary-foreground font-bold px-6 py-2 rounded-lg hover:shadow-[0_0_20px_rgba(254,208,27,0.4)] hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Upload
          </Link>

          <button 
            className={`md:hidden p-2 text-primary relative z-[200] transition-colors ${isScrolled || isMenuOpen ? 'text-foreground' : 'text-white'}`} 
            onClick={() => { 
              if (isMenuOpen) {
                setIsMenuOpen(false);
                document.body.style.overflow = '';
              } else {
                setIsMenuOpen(true); 
                document.body.style.overflow = 'hidden'; 
              }
            }}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <>
          {/* Full screen dark overlay — blocks everything behind */}
          <div 
            className="fixed inset-0 z-[100] bg-[#040118]"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          />
          
          {/* Drawer content on top of overlay */}
          <div 
            className="fixed inset-0 z-[101] flex flex-col md:hidden"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', backgroundColor: '#040118' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/10">
              <span className="text-2xl font-bold text-white">🐝 StudyHive</span>
            </div>

            {/* Nav Links */}
            <div className="flex flex-col px-6 py-8 gap-1 flex-1">
              <Link 
                to="/" 
                onClick={() => { setIsMenuOpen(false); document.body.style.overflow = ''; }}
                className="text-xl font-bold px-4 py-4 rounded-xl transition-all text-white/80 hover:text-white hover:bg-white/5"
              >
                Home
              </Link>
              <Link 
                to="/" 
                search={{ scrollTo: 'subjects' }}
                onClick={(e) => {
                  setIsMenuOpen(false);
                  document.body.style.overflow = '';
                  if (window.location.pathname === "/") {
                    e.preventDefault();
                    document.getElementById("browse-subjects")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="text-xl font-bold px-4 py-4 rounded-xl transition-all text-white/80 hover:text-white hover:bg-white/5"
              >
                Subjects
              </Link>
              <Link 
                to="/search" 
                onClick={() => { setIsMenuOpen(false); document.body.style.overflow = ''; }}
                className="text-xl font-bold px-4 py-4 rounded-xl transition-all text-white/80 hover:text-white hover:bg-white/5"
              >
                Search
              </Link>
              <Link 
                to="/upload" 
                onClick={() => { setIsMenuOpen(false); document.body.style.overflow = ''; }}
                className="text-xl font-bold px-4 py-4 rounded-xl transition-all text-white/80 hover:text-white hover:bg-white/5"
              >
                Upload
              </Link>
              <Link 
                to="/admin" 
                onClick={() => { setIsMenuOpen(false); document.body.style.overflow = ''; }}
                className="text-xl font-bold px-4 py-4 rounded-xl transition-all text-white/80 hover:text-white hover:bg-white/5"
              >
                Admin
              </Link>
            </div>

            {/* Bottom CTA */}
            <div className="px-6 pb-10">
              <Link 
                to="/upload" 
                onClick={() => { setIsMenuOpen(false); document.body.style.overflow = ''; }}
                className="block w-full bg-[#fed01b] text-[#040118] font-bold text-lg text-center py-4 rounded-2xl active:scale-95 transition-all duration-150 hover:brightness-110"
              >
                Upload Now
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

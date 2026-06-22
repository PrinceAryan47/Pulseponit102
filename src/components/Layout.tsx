import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  Activity, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Heart, 
  Stethoscope, 
  Hospital, 
  FileText, 
  BookOpen,
  LayoutDashboard,
  Bell,
  Sun,
  Moon,
  Pill,
  LifeBuoy,
  Shield,
  Calendar,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronRight,
  Download,
  Search,
  CloudOff,
  Wifi
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import NotificationDropdown from './NotificationDropdown';
import GlobalSearch from './GlobalSearch';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as any, // Custom smooth cubic bezier
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.7, 0, 0.84, 0] as any, // Fast ease-in cubic bezier
    }
  }
};

const Layout: React.FC = () => {
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Scroll window and containers to top instantly on route/path changes for seamless transitions
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    const mainContainers = document.querySelectorAll('main');
    mainContainers.forEach(container => {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    });
  }, [location.pathname]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(Boolean((window as any).firestoreQuotaExceeded));

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setIsQuotaExceeded(true);
    };
    window.addEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setWasOffline(prev => {
        if (prev) {
          setShowOnlineBanner(true);
          const timer = setTimeout(() => {
            setShowOnlineBanner(false);
          }, 4000);
          return false;
        }
        return prev;
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      setShowOnlineBanner(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NETWORK_STATUS') {
          if (event.data.online) {
            handleOnline();
          } else {
            handleOffline();
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSWMessage);

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_STATUS' });
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const admins = ["mafialord1247@gmail.com", "mafia.lord1247@gmail.com", "prince47aryan@gmail.com"];
  const isSuperAdmin = user && admins.includes(user.email || '');

  const isDashboardRoute = user && (
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/doctor-dashboard') || 
    location.pathname.startsWith('/admin') ||
    location.pathname === '/appointments' || 
    location.pathname === '/medical-records' ||
    location.pathname === '/prescriptions' ||
    location.pathname === '/profile' ||
    location.pathname.startsWith('/chat') ||
    location.pathname.startsWith('/meeting')
  );

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (profile?.role === 'doctor') return '/doctor-dashboard';
    return '/dashboard';
  };

  const patientNavItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', path: '/appointments', icon: Calendar },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Medical Records', path: '/medical-records', icon: FileText },
    { label: 'Prescriptions', path: '/prescriptions', icon: Pill },
    { label: 'Health Tools', path: '/health-tools', icon: Activity },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope },
    { label: 'Hospitals', path: '/hospitals', icon: Hospital },
    { label: 'Health News', path: '/articles', icon: BookOpen },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const doctorNavItems = [
    { label: 'Overview', path: '/doctor-dashboard?tab=overview', icon: LayoutDashboard },
    { label: 'Appointments', path: '/doctor-dashboard?tab=appointments', icon: Calendar },
    { label: 'Patients', path: '/doctor-dashboard?tab=patients', icon: Users },
    { label: 'Consultations', path: '/doctor-dashboard?tab=consultations', icon: Stethoscope },
    { label: 'Prescriptions', path: '/doctor-dashboard?tab=prescriptions', icon: Pill },
    { label: 'Medical Records', path: '/doctor-dashboard?tab=medical-records', icon: FileText },
    { label: 'Messages', path: '/doctor-dashboard?tab=messages', icon: MessageSquare },
    { label: 'Analytics', path: '/doctor-dashboard?tab=analytics', icon: BarChart3 },
    { label: 'Workplace', path: '/doctor-dashboard?tab=workplace', icon: Hospital },
    { label: 'Health News', path: '/doctor-dashboard?tab=articles', icon: BookOpen },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const publicNavItems = [
    { label: 'Emergency', path: '/first-aid', icon: LifeBuoy },
  ];

  const sidebarItems = profile?.role === 'doctor' ? doctorNavItems : patientNavItems;
  
  const finalSidebarItems = [...sidebarItems];
  if (isSuperAdmin) {
    finalSidebarItems.push({ label: 'Admin Panel', path: '/admin', icon: Shield });
  }

  const isActive = (path: string) => location.pathname === path;

  if (isDashboardRoute) {
    return (
      <div className="min-h-screen bg-background flex transition-colors duration-300">
        {/* Sidebar */}
        <aside className="w-64 bg-background border-r border-border hidden lg:flex flex-col sticky top-0 h-screen transition-colors duration-300">
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:bg-neon-blue-dark transition-colors shadow-lg shadow-primary/20 neon-glow">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight neon-text">PulsePoint</span>
            </Link>
          </div>

          <nav className="flex-grow p-4 space-y-1 overflow-y-auto no-scrollbar">
            {finalSidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            
            {showInstallBtn && (
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-xl text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-all border border-primary/20"
              >
                <Download className="w-5 h-5" />
                Install App
              </button>
            )}
          </nav>

          <div className="p-4 border-t border-border">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col min-h-screen overflow-hidden">
          {isQuotaExceeded && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-500 px-6 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 select-none shrink-0">
              <CloudOff className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
              <span>Cloud Quota Limit Reached: PulsePoint has seamlessly engaged robust Offline / Demo Mode. High-performance simulations, guides, and diagnostic calculators remain fully active!</span>
            </div>
          )}
          {/* Dashboard Header */}
          <header className="h-16 bg-background border-b border-border flex items-center justify-between px-8 sticky top-0 z-50 transition-colors duration-300">
            <div className="flex items-center gap-4 lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-all"
                title="Search PulsePoint"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link to="/" className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-primary" />
              </Link>
            </div>

            <div className="flex-grow max-w-xl mx-4 hidden sm:block">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2 bg-muted/40 hover:bg-muted/75 text-muted-foreground hover:text-foreground border border-border rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-muted-foreground/80 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Search doctors, articles, first aid...</span>
                </div>
                <div className="flex items-center gap-1 bg-background border border-border px-1.5 py-0.5 rounded text-[10px] font-mono select-none">
                  <span>⌘K</span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <AnimatePresence mode="popLayout">
                {isOffline && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-bold leading-none select-none shrink-0"
                    title="Lost connection to PulsePoint"
                  >
                    <CloudOff className="w-3.5 h-3.5 animate-pulse" />
                    <span className="hidden sm:inline">Offline Mode</span>
                    <span className="sm:hidden">Offline</span>
                  </motion.div>
                )}
                {showOnlineBanner && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-xs font-bold leading-none select-none shrink-0"
                  >
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Back Online</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <NotificationDropdown />
              <div className="h-8 w-px bg-border mx-2"></div>
              <Link to="/profile" className="flex items-center gap-3 group">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-foreground">{profile?.fullName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                </div>
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center border-2 border-border">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </Link>
            </div>
          </header>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="fixed inset-0 z-[60] lg:hidden">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
              <aside className="absolute inset-y-0 left-0 w-64 bg-background shadow-2xl flex flex-col">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <span className="text-xl font-bold neon-text">PulsePoint</span>
                  <button onClick={() => setIsMenuOpen(false)} className="text-muted-foreground"><X className="w-6 h-6" /></button>
                </div>
                <nav className="flex-grow p-4 space-y-1">
                  {finalSidebarItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                        isActive(item.path)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </aside>
            </div>
          )}

          <main className="flex-grow overflow-y-auto relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="min-h-full motion-gpu"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>
    );
  }

  const allNavItems = [...publicNavItems];
  if (user) {
    allNavItems.unshift({ label: 'Dashboard', path: getDashboardPath(), icon: LayoutDashboard });
    if (isSuperAdmin) {
      allNavItems.push({ label: 'Admin', path: '/admin', icon: Shield });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      {isQuotaExceeded && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-500 px-6 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 select-none shrink-0">
          <CloudOff className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
          <span>Cloud Quota Limit Reached: PulsePoint has seamlessly engaged robust Offline / Demo Mode. High-performance simulations, guides, and diagnostic calculators remain fully active!</span>
        </div>
      )}
      {/* Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center group-hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/30 neon-glow group-hover:scale-110">
                  <Heart className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-foreground tracking-tighter neon-text leading-none uppercase">PulsePoint</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Health for all</span>
                </div>
              </Link>
              
              <div className="hidden lg:ml-12 lg:flex lg:space-x-2">
                {allNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "inline-flex items-center px-4 py-2 text-sm font-bold rounded-xl transition-all relative group/item",
                      item.label === 'Emergency'
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700"
                        : isActive(item.path) 
                          ? "text-primary bg-primary/10 shadow-sm" 
                          : "text-muted-foreground hover:text-primary hover:bg-muted"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 mr-2 transition-transform group-hover/item:scale-125",
                      item.label === 'Emergency' ? "text-white animate-pulse" : isActive(item.path) ? "text-primary" : "text-muted-foreground/60"
                    )} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden md:flex md:items-center md:gap-4">
              <AnimatePresence mode="popLayout">
                {isOffline && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-bold leading-none select-none shrink-0"
                    title="Lost connection to PulsePoint"
                  >
                    <CloudOff className="w-3.5 h-3.5 animate-pulse" />
                    <span>Offline Mode</span>
                  </motion.div>
                )}
                {showOnlineBanner && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-xs font-bold leading-none select-none shrink-0"
                  >
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Back Online</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                title="Search PulsePoint (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>

              <button 
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {user ? (
                <div className="flex items-center gap-4">
                  <NotificationDropdown />
                  <div className="h-8 w-px bg-border"></div>
                  <Link to="/profile" className="flex items-center gap-3 group">
                    <div className="text-right hidden lg:block">
                      <p className="text-sm font-semibold text-foreground leading-tight">{profile?.fullName || 'User'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'Patient'}</p>
                    </div>
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-border" />
                    ) : (
                      <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center border-2 border-border group-hover:border-primary/30 transition-colors">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-xl hover:bg-neon-blue-dark transition-colors shadow-lg shadow-primary/20"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center md:hidden gap-2">
              <AnimatePresence mode="popLayout">
                {isOffline && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-bold leading-none select-none shrink-0"
                    title="Lost connection to PulsePoint"
                  >
                    <CloudOff className="w-3 h-3 animate-pulse" />
                    <span>Offline</span>
                  </motion.div>
                )}
                {showOnlineBanner && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-bold leading-none select-none shrink-0"
                  >
                    <Wifi className="w-3 h-3 text-emerald-500" />
                    <span>Online</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg"
                title="Search (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t border-border py-6 px-4 space-y-2 transition-colors duration-300">
            {allNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center px-6 py-4 text-lg font-black rounded-2xl transition-all uppercase tracking-tighter",
                  item.label === 'Emergency'
                    ? "text-white bg-red-600 shadow-lg shadow-red-600/20"
                    : isActive(item.path)
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn(
                  "w-6 h-6 mr-4",
                  item.label === 'Emergency' && "animate-pulse"
                )} />
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="pt-4 mt-4 border-t border-border">
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-muted-foreground rounded-xl hover:bg-muted"
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center px-4 py-3 text-base font-medium text-destructive rounded-xl hover:bg-destructive/10"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-4 mt-4 border-t border-border space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-3 text-base font-medium text-muted-foreground rounded-xl bg-muted"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-3 text-base font-medium text-primary-foreground bg-primary rounded-xl"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-full motion-gpu"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <Heart className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
                </div>
                <span className="text-2xl font-black text-foreground tracking-tighter neon-text uppercase">PulsePoint</span>
              </Link>
              <p className="text-xl text-muted-foreground max-w-sm leading-tight font-medium mb-6">
                Connecting everyone to better care, one click at a time.
              </p>
              {showInstallBtn && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20"
                >
                  <Download className="w-5 h-5" />
                  Download Web App
                </button>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link to="/health-tools" className="text-muted-foreground hover:text-primary transition-colors">Health Tools</Link></li>
                <li><Link to="/hospitals" className="text-muted-foreground hover:text-primary transition-colors">Find Hospitals</Link></li>
                <li><Link to="/doctors" className="text-muted-foreground hover:text-primary transition-colors">Doctor Directory</Link></li>
                <li><Link to="/first-aid" className="text-muted-foreground hover:text-primary transition-colors">First Aid Guide</Link></li>
                <li><Link to="/articles" className="text-muted-foreground hover:text-primary transition-colors">Health News</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">© 2026 PulsePoint. All rights reserved.</p>
            <div className="flex gap-6">
              {/* Social placeholders */}
              <div className="w-5 h-5 bg-muted rounded-full"></div>
              <div className="w-5 h-5 bg-muted rounded-full"></div>
              <div className="w-5 h-5 bg-muted rounded-full"></div>
            </div>
          </div>
        </div>
      </footer>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default Layout;

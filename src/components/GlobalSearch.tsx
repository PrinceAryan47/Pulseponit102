import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  BookOpen, 
  Calculator, 
  Heart, 
  Activity, 
  X, 
  Command, 
  ChevronRight, 
  Hospital, 
  ArrowRight,
  LifeBuoy,
  Flame,
  Droplets,
  Moon,
  Baby,
  Flower,
  Stethoscope,
  Globe
} from 'lucide-react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { AnimatePresence, motion } from 'framer-motion';

// Defined types for search index
interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: 'doctor' | 'article' | 'first-aid' | 'tool' | 'hospital';
  link: string;
  icon: React.ComponentType<any>;
  details?: string;
  imageUrl?: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Dynamic collections from Firestore
  const [dbDoctors, setDbDoctors] = useState<any[]>([]);
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch search data from Firestore when search opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchDatabaseItems = async () => {
      setLoading(true);
      try {
        // Fetch active doctors
        const docQuery = query(collection(db, 'users'), where('role', '==', 'doctor'));
        const docSnap = await getDocs(docQuery);
        const docs = docSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDbDoctors(docs);

        // Fetch articles
        const artQuery = query(collection(db, 'articles'));
        const artSnap = await getDocs(artQuery);
        const arts = artSnap.docs.map(a => ({ id: a.id, ...a.data() }));
        setDbArticles(arts);
      } catch (err) {
        console.error("Error loading search index from Firestore:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatabaseItems();
    
    // Auto focus search input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [isOpen]);

  // Static items (health tools and firstaid guides)
  const staticItems = useMemo<SearchItem[]>(() => [
    // Health Utilities
    {
      id: 'bmi',
      title: 'BMI Calculator',
      description: 'Calculate your Body Mass Index (BMI) and find your weight category.',
      category: 'tool',
      link: '/health-tools?tool=bmi',
      icon: Calculator,
      details: 'Weight status, height ratio, obesity metrics'
    },
    {
      id: 'symptom',
      title: 'AI Symptom Checker',
      description: 'Check symptoms with our AI diagnostics assistant to get medical hints.',
      category: 'tool',
      link: '/health-tools?tool=symptom',
      icon: Stethoscope,
      details: 'Disease screening, health checks, AI analysis'
    },
    {
      id: 'calorie',
      title: 'Calorie Calculator',
      description: 'Calculate your daily caloric needs and Basal Metabolic Rate (BMR).',
      category: 'tool',
      link: '/health-tools?tool=calorie',
      icon: Flame,
      details: 'BMR, energy expenditure, intake limits'
    },
    {
      id: 'water',
      title: 'Water Intake Tracker',
      description: 'Find out how much water you should drink daily to stay healthy.',
      category: 'tool',
      link: '/health-tools?tool=water',
      icon: Droplets,
      details: 'Hydration metrics, fluid balance'
    },
    {
      id: 'heart',
      title: 'Heart Rate Calculator',
      description: 'Find your target heart rate zones for safe cardio training.',
      category: 'tool',
      link: '/health-tools?tool=heart',
      icon: Activity,
      details: 'BPM, aerobic threshold, workout beats, pulse rate'
    },
    {
      id: 'pregnancy',
      title: 'Pregnancy Due Date Tracker',
      description: 'Estimate your delivery date and view pregnancy milestone schedules.',
      category: 'tool',
      link: '/health-tools?tool=pregnancy',
      icon: Baby,
      details: 'Trimester guide, birth timeline, prenatal calendar'
    },
    {
      id: 'period',
      title: 'Period Cycle Tracker',
      description: 'Track menstrual cycles, ovulation windows, and fertility dates.',
      category: 'tool',
      link: '/health-tools?tool=period',
      icon: Flower,
      details: 'Women health, fertility cycles, reproductive wellness'
    },
    {
      id: 'mens-health',
      title: "Men's Health Guide",
      description: 'Access tailored lifestyle, diet, and screenings recommendations for men.',
      category: 'tool',
      link: '/health-tools?tool=mens-health',
      icon: Activity,
      details: 'Prostate health, muscle build, testosterones, dietary'
    },
    {
      id: 'sleep',
      title: 'Sleep Cycle Calculator',
      description: 'Find perfect times to sleep and wake up based on body circadian rhythms.',
      category: 'tool',
      link: '/health-tools?tool=sleep',
      icon: Moon,
      details: 'REM cycles, restorative rest, alarm time setup'
    },
    {
      id: 'fitness',
      title: 'Fitness Workout planner',
      description: 'Generate customizable workout splits and dynamic exercises.',
      category: 'tool',
      link: '/health-tools?tool=fitness',
      icon: Activity,
      details: 'Cardio, strength lists, routine schedules'
    },

    // First Aid Guides
    {
      id: 'cpr',
      title: 'CPR (Adult Resuscitation)',
      description: 'Emergency cardiopulmonary resuscitation instructions (chests compressions).',
      category: 'first-aid',
      link: '/first-aid?guide=cpr',
      icon: Heart,
      details: 'Heart attack, unconscious, emergency chest pumping, CPR rhythm'
    },
    {
      id: 'choking',
      title: 'Choking Rescue (Heimlich Maneuver)',
      description: 'Critical steps for clearing airway blockages in responsive adults.',
      category: 'first-aid',
      link: '/first-aid?guide=choking',
      icon: LifeBuoy,
      details: 'Windpipe obstacle, Heimlich maneuver, air choke rescue'
    },
    {
      id: 'bleeding',
      title: 'Severe Bleeding Control',
      description: 'How to apply direct pressure and manage intense traumatic hemorrhages.',
      category: 'first-aid',
      link: '/first-aid?guide=bleeding',
      icon: Droplets,
      details: 'Artery cut, wound bandaging, tourniquet application'
    },
    {
      id: 'burns',
      title: 'Burn Injury Treatment',
      description: 'Immediate first aid for thermal, chemical, or radiation burns.',
      category: 'first-aid',
      link: '/first-aid?guide=burns',
      icon: Flame,
      details: 'Scalding hot, blister care, cooling skin'
    },
    {
      id: 'heart-attack',
      title: 'Heart Attack Protocol',
      description: 'Actions to perform immediately when someone shows heart attack symptoms.',
      category: 'first-aid',
      link: '/first-aid?guide=heart-attack',
      icon: Activity,
      details: 'Chest tight pressure, myocardial arrest, aspirin intake'
    },
    {
      id: 'poisoning',
      title: 'Poisoning Care',
      description: 'Safety guidelines for toxic ingestions, chemical contact, or gas inhalation.',
      category: 'first-aid',
      link: '/first-aid?guide=poisoning',
      icon: LifeBuoy,
      details: 'Toxic liquid, Poison control call, chemical swallow'
    },
    {
      id: 'stroke',
      title: 'Stroke (F.A.S.T.) Response',
      description: 'Recognizing stroke symptoms using the Face, Arm, Speech, Time formula.',
      category: 'first-aid',
      link: '/first-aid?guide=stroke',
      icon: LifeBuoy,
      details: 'Brain clot, facial droop, arm weak balance, FAST'
    },

    // Hospitals directory
    {
      id: 'hospitals-finder',
      title: 'Hospitals & Medical Centers Map',
      description: 'Find, query, and trace operating healthcare centers and pharmacies nearby.',
      category: 'hospital',
      link: '/hospitals',
      icon: Hospital,
      details: 'Clinics near me, 24/7 emergency rooms, pharmacy locations, maps centering'
    }
  ], []);

  // 2. Compute dynamic items (Doctors + Articles) mapped to SearchItem schema
  const fetchedItems = useMemo<SearchItem[]>(() => {
    const doctors = dbDoctors.map(doc => ({
      id: doc.id || doc.uid,
      title: `Dr. ${doc.fullName}`,
      description: doc.specialization ? `${doc.specialization} specialist` : 'General Medical Practitioner',
      category: 'doctor' as const,
      link: '/doctors',
      icon: User,
      details: `${doc.biography || ''} ${doc.hospitalName || ''} consultation scheduling appointments`,
      imageUrl: doc.photoURL
    }));

    const articles = dbArticles.map(art => ({
      id: art.id,
      title: art.title,
      description: art.summary || 'Click here to read this article and stay updated.',
      category: 'article' as const,
      link: `/articles/${art.id}`,
      icon: BookOpen,
      details: `${art.content || ''} ${art.category || ''} author: ${art.authorName || ''} source: ${art.sourceName || ''}`,
      imageUrl: art.imageURL
    }));

    return [...doctors, ...articles];
  }, [dbDoctors, dbArticles]);

  // Combine both indices
  const allItems = useMemo(() => [...staticItems, ...fetchedItems], [staticItems, fetchedItems]);

  // 3. Search algorithm (matching keyword strings)
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      // If no query, return some recommended resources
      return allItems.filter(item => 
        item.id === 'symptom' || 
        item.id === 'cpr' || 
        item.id === 'hospitals-finder' || 
        item.category === 'article'
      ).slice(0, 7);
    }

    const queryLower = searchTerm.toLowerCase();
    
    return allItems.filter(item => {
      return (
        item.title.toLowerCase().includes(queryLower) ||
        item.description.toLowerCase().includes(queryLower) ||
        (item.details && item.details.toLowerCase().includes(queryLower)) ||
        item.category.toLowerCase().includes(queryLower)
      );
    }).slice(0, 10); // cap results to top 10 for neatness
  }, [allItems, searchTerm]);

  // Reset selected item index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // 4. Keyboard Navigation Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  // Handle outside clicks to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (item: SearchItem) => {
    navigate(item.link);
    onClose();
    // Clear state
    setSearchTerm('');
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'doctor':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'article':
        return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      case 'first-aid':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20 animate-pulse';
      case 'tool':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case 'hospital':
        return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'doctor': return 'Doctor Profile';
      case 'article': return 'Medical Article';
      case 'first-aid': return 'CPR & First Aid';
      case 'tool': return 'Health Calculator';
      case 'hospital': return 'Hospital Facility';
      default: return category;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="global-search-portal" className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Search Box Card */}
          <motion.div 
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-background/95 border border-border rounded-3xl shadow-2xl flex flex-col max-h-[75vh] overflow-hidden backdrop-filter"
          >
            {/* Header: Input search */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
              <Search className="w-6 h-6 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search doctors, articles, calculators, first aid..."
                className="w-full bg-transparent border-none outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground text-lg "
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-1.5 shrink-0 ml-2 bg-muted/40 border border-border px-2 py-1 rounded-lg">
                <kbd className="text-[10px] font-sans font-bold text-muted-foreground/80">ESC</kbd>
              </div>
            </div>

            {/* Main items panel */}
            <div className="flex-grow overflow-y-auto p-3 space-y-1 select-none scrollbar-thin">
              {loading && searchTerm.trim() === '' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-sm font-medium">Reindexing healthcare resources...</span>
                </div>
              ) : filteredItems.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest flex items-center justify-between">
                    <span>{searchTerm.trim() ? 'Search Results' : 'Recommended Medical Resources'}</span>
                    <span>{filteredItems.length} found</span>
                  </div>

                  {filteredItems.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    const ItemIcon = item.icon;

                    return (
                      <div
                        key={`${item.category}-${item.id}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-primary/10 border-primary/25 border shadow-sm translate-x-1' 
                            : 'hover:bg-muted/45 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-grow">
                          {/* Left Avatar / Icon indicator */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt="" 
                                className="w-full h-full object-cover rounded-xl"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <ItemIcon className={`w-5 h-5 ${
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                            )}
                          </div>

                          {/* Titles and summaries */}
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-foreground text-sm tracking-tight truncate block">
                                {item.title}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getCategoryBadge(item.category)}`}>
                                {getCategoryLabel(item.category)}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs line-clamp-1 leading-normal">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Right arrow detail indicator */}
                        <div className={`flex items-center shrink-0 ml-3 transition-all ${
                          isSelected ? 'translate-x-1 opacity-100 text-primary' : 'opacity-0 text-muted-foreground'
                        }`}>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-muted-foreground/60" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1.5">No resources found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm leading-relaxed px-4">
                    Could not find search hits matching "{searchTerm}". Check spelling or try queries like "cpr", "bmi", "doctor", or "diet".
                  </p>
                </div>
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="px-6 py-4 border-t border-border bg-muted/20 text-muted-foreground flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1">
                  <kbd className="bg-muted border border-border px-1.5 py-0.5 rounded leading-none text-[10px]">↑↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-muted border border-border px-1.5 py-0.5 rounded leading-none text-[10px]">Enter</kbd>
                  to select
                </span>
              </div>
              <span className="font-bold text-primary flex items-center gap-1">
                <Command className="w-3.5 h-3.5" /> PulsePoint Search
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;

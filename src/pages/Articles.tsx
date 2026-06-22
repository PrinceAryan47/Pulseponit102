import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Article } from '../types';
import { useAuth } from '../context/AuthContext';
import { checkAndRefreshArticles } from '../services/articleService';
import { 
  BookOpen, 
  Search, 
  Clock, 
  User, 
  ChevronRight,
  TrendingUp,
  Heart,
  Activity,
  Apple,
  Plus,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import VoiceSearch from '../components/VoiceSearch';
import { safeFormat } from '../lib/dateUtils';

const Articles: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAndRefreshArticles();
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Article)));
    });
    return () => unsubscribe();
  }, []);

  const categories = [
    { name: 'All', icon: BookOpen },
    { name: 'Nutrition', icon: Apple },
    { name: 'Fitness', icon: Activity },
    { name: 'Mental Health', icon: Heart },
    { name: 'Prevention', icon: TrendingUp },
  ];

  const displayArticles = articles;

  const filteredArticles = displayArticles.filter(a => 
    (a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === 'All' || a.category === selectedCategory)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight neon-text">Health News</h1>
          <p className="text-lg text-muted-foreground">
            Stay informed with the latest medical discoveries, wellness tips, and expert health advice from around the world.
          </p>
        </div>
        {(profile?.role === 'doctor') && (
          <Link
            to="/articles/create"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Create Article
          </Link>
        )}
      </div>

      {/* Search and Categories */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        <div className="relative flex-grow flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles by title or keywords..."
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-[2rem] focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm text-foreground"
            />
          </div>
          <VoiceSearch onResult={(text) => setSearchTerm(text)} />
        </div>
        <div className="flex overflow-x-auto pb-2 lg:pb-0 gap-3 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 rounded-[2rem] font-bold whitespace-nowrap transition-all border",
                selectedCategory === cat.name
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 neon-glow"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              <cat.icon className="w-4 h-4" />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Article */}
      {filteredArticles.length > 0 && selectedCategory === 'All' && !searchTerm && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(`/articles/${filteredArticles[0].id}`)}
          className="relative rounded-[3rem] overflow-hidden mb-12 group cursor-pointer shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10"></div>
          <img 
            src={filteredArticles[0].imageURL} 
            alt="" 
            className="w-full h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 left-0 p-8 lg:p-16 z-20 max-w-3xl">
            <span className="px-4 py-1 bg-neon-blue text-slate-900 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block">
              Featured Article
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {filteredArticles[0].title}
            </h2>
            <p className="text-slate-200 text-lg mb-8 line-clamp-2">
              {filteredArticles[0].summary}
            </p>
            <div className="flex items-center gap-6 text-slate-300">
              <div className="flex items-center gap-2">
                {filteredArticles[0].sourceUrl ? (
                  <a 
                    href={filteredArticles[0].sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-primary hover:underline group/src"
                  >
                    <Globe className="w-4 h-4 text-primary shrink-0 transition-transform group-hover/src:scale-110" />
                    <span className="text-sm font-bold truncate">Source: {filteredArticles[0].sourceName || filteredArticles[0].authorName}</span>
                  </a>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{filteredArticles[0].authorName}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{safeFormat(filteredArticles[0].createdAt, 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredArticles.map((article, idx) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate(`/articles/${article.id}`)}
            className="bg-card rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group cursor-pointer"
          >
            <div className="relative h-56 overflow-hidden">
              <img 
                src={article.imageURL} 
                alt={article.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
                {article.category}
              </div>
            </div>
            <div className="p-8 flex-grow flex flex-col">
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-4">
                <span className="flex items-center gap-1.5 shrink-0"><Clock className="w-3.5 h-3.5" /> {safeFormat(article.createdAt, 'MMM dd')}</span>
                <span className="w-1 h-1 bg-border rounded-full shrink-0"></span>
                <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                  {article.sourceUrl || article.authorId === 'system' ? (
                    <a 
                      href={article.sourceUrl || 'https://www.who.int'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-primary hover:underline group/src inline-flex"
                    >
                      <Globe className="w-3.5 h-3.5 text-primary shrink-0 transition-transform group-hover/src:scale-110" />
                      <span className="truncate">Source: {article.sourceName || article.authorName || 'Verified Health Hub'}</span>
                    </a>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 shrink-0 mr-1" />
                      {article.authorName}
                    </>
                  )}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                {article.summary}
              </p>
              <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Read More</span>
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Copyright and Educational Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 p-8 bg-muted/40 rounded-[2rem] border border-border/60 text-center max-w-4xl mx-auto"
      >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        <h4 className="font-bold text-foreground mb-2">Sources & Copyright Informational Notice</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The articles, health guidelines, wellness tips, and medical summaries delivered on the PulsePoint platform are curated using verified medical information available from globally recognized, trusted healthcare authorities and online public registers (including the <strong>World Health Organization (WHO)</strong>, <strong>CDC</strong>, <strong>National Institutes of Health (NIH)</strong>, <strong>NHS</strong>, and <strong>Mayo Clinic</strong>). 
        </p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          PulsePoint summarizes and cites these materials purely for public benefit, educational reference, and non-commercial awareness. We make every effort to feature direct outbound reference URLs back to original scientific registries, and do not seek proprietary ownership or exclusive copyrights over health bulletins. Always seek the advice of qualified medical clinicians regarding individual health questions or critical circumstances.
        </p>
      </motion.div>
    </div>
  );
};

export default Articles;

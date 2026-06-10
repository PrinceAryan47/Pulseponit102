import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface GuestOverlayProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const GuestOverlay: React.FC<GuestOverlayProps> = ({ 
  children, 
  title = "Sign in to use this feature", 
  description = "Join PulsePoint to unlock full access to our health tools and services." 
}) => {
  const { user, loading } = useAuth();

  if (loading) return <>{children}</>;
  if (user) return <>{children}</>;

  return (
    <div className="relative group/overlay">
      {/* The content is visible but blurred/unclickable */}
      <div className="pointer-events-none select-none filter blur-[2px] opacity-60 transition-all duration-500 group-hover/overlay:blur-[4px]">
        {children}
      </div>

      {/* The overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-white/10 dark:bg-black/10 backdrop-blur-[1px] rounded-[2.5rem]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 text-center"
        >
          <div className="w-16 h-16 bg-neon-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-neon-blue" />
          </div>
          <h3 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-3 tracking-tight">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/login" 
              className="flex-1 py-3 bg-neon-blue text-slate-900 rounded-xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 flex items-center justify-center gap-2"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
            >
              Register
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GuestOverlay;

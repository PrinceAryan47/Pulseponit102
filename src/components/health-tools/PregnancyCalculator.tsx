import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Baby } from 'lucide-react';

const PregnancyCalculator: React.FC = () => {
  const [lmp, setLmp] = useState('');
  const [result, setResult] = useState<{ dueDate: string; weeks: number } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lmp) return;
    
    const date = new Date(lmp);
    // Naegele's Rule: LMP + 7 days - 3 months + 1 year
    const dueDate = new Date(date);
    dueDate.setDate(dueDate.getDate() + 7);
    dueDate.setMonth(dueDate.getMonth() + 9);
    
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const weeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    setResult({
      dueDate: dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      weeks
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Pregnancy Due Date</h2>
      <p className="text-muted-foreground mb-10">Estimate your due date based on your last menstrual period (LMP).</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Last Period Start Date</label>
            <input
              type="date"
              value={lmp}
              onChange={(e) => setLmp(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl outline-none text-foreground"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow"
          >
            Calculate Due Date
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-3xl border border-border">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center w-full"
            >
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Baby className="w-10 h-10 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Estimated Due Date</p>
              <p className="text-4xl font-bold text-foreground mb-6 tracking-tight neon-text">{result.dueDate}</p>
              <div className="p-4 bg-card rounded-2xl border border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Progress</p>
                <p className="text-xl font-bold text-foreground">Week {result.weeks}</p>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <Baby className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Select your LMP date to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PregnancyCalculator;

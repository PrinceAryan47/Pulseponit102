import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flower } from 'lucide-react';

const PeriodTracker: React.FC = () => {
  const [lmp, setLmp] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [result, setResult] = useState<{ nextPeriod: string; ovulation: string } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lmp) return;
    
    const date = new Date(lmp);
    const nextPeriod = new Date(date);
    nextPeriod.setDate(nextPeriod.getDate() + parseInt(cycleLength));
    
    const ovulation = new Date(nextPeriod);
    ovulation.setDate(ovulation.getDate() - 14);
    
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    setResult({
      nextPeriod: nextPeriod.toLocaleDateString('en-US', options),
      ovulation: ovulation.toLocaleDateString('en-US', options)
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Period Tracker</h2>
      <p className="text-muted-foreground mb-10">Track your menstrual cycle and estimate your next period and ovulation dates.</p>
      
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
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Average Cycle Length (days)</label>
            <input
              type="number"
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl outline-none text-foreground"
              placeholder="e.g. 28"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow"
          >
            Track Cycle
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-3xl border border-border">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center w-full"
            >
              <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Flower className="w-10 h-10 text-pink-500" />
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Next Period Expected</p>
                  <p className="text-3xl font-bold text-foreground tracking-tight neon-text">{result.nextPeriod}</p>
                </div>
                <div className="p-4 bg-card rounded-2xl border border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Estimated Ovulation</p>
                  <p className="text-xl font-bold text-pink-500">{result.ovulation}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <Flower className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Enter your cycle details to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodTracker;

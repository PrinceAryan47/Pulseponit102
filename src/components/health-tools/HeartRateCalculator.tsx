import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const HeartRateCalculator: React.FC = () => {
  const [age, setAge] = useState('');
  const [result, setResult] = useState<{ max: number; targetMin: number; targetMax: number } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseInt(age);
    if (a > 0) {
      const max = 220 - a;
      setResult({
        max,
        targetMin: Math.round(max * 0.5),
        targetMax: Math.round(max * 0.85)
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Heart Rate Checker</h2>
      <p className="text-muted-foreground mb-10">Determine your maximum heart rate and target zones for exercise.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Age (years)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl outline-none text-foreground"
              placeholder="e.g. 30"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow"
          >
            Calculate Zones
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-3xl border border-border">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center w-full"
            >
              <div className="mb-8">
                <p className="text-sm font-medium text-muted-foreground mb-2">Max Heart Rate</p>
                <p className="text-4xl font-bold text-foreground tracking-tight">{result.max} <span className="text-lg font-normal text-muted-foreground">bpm</span></p>
              </div>
              <div className="p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                <p className="text-sm font-bold text-red-500 uppercase tracking-widest mb-2">Target Training Zone</p>
                <p className="text-4xl font-bold text-foreground tracking-tight neon-text">{result.targetMin} - {result.targetMax}</p>
                <p className="text-xs text-muted-foreground mt-2">50% to 85% of maximum heart rate</p>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Enter your age to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeartRateCalculator;

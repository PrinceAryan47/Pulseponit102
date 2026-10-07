import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';

const WaterCalculator: React.FC = () => {
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (w > 0) {
      const intake = w * 0.033;
      setResult(parseFloat(intake.toFixed(1)));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Water Intake Calculator</h2>
      <p className="text-muted-foreground mb-10">Calculate how much water you should drink daily based on your weight.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl outline-none text-foreground"
              placeholder="e.g. 70"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow"
          >
            Calculate Intake
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-3xl border border-border">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Droplets className="w-10 h-10 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Recommended Daily Intake</p>
              <p className="text-6xl font-bold text-foreground mb-4 tracking-tight neon-text">{result} <span className="text-2xl font-normal text-muted-foreground">Liters</span></p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                That's approximately {Math.round(result * 4)} glasses (250ml each) per day.
              </p>
            </motion.div>
          ) : (
            <div className="text-center">
              <Droplets className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Enter your weight to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaterCalculator;

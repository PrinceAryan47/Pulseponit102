import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { cn } from '../../lib/utils';

const BMICalculator: React.FC = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<{ bmi: number; category: string; color: string } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) {
      const bmi = parseFloat((w / (h * h)).toFixed(1));
      let category = '';
      let color = '';
      if (bmi < 18.5) { category = 'Underweight'; color = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'; }
      else if (bmi < 25) { category = 'Normal weight'; color = 'text-primary bg-primary/10'; }
      else if (bmi < 30) { category = 'Overweight'; color = 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'; }
      else { category = 'Obese'; color = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'; }
      setResult({ bmi, category, color });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">BMI Calculator</h2>
      <p className="text-muted-foreground mb-10">Calculate your Body Mass Index to understand your weight status.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
              placeholder="e.g. 70"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
              placeholder="e.g. 175"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow"
          >
            Calculate BMI
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-3xl border border-border">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <p className="text-sm font-medium text-muted-foreground mb-2">Your BMI is</p>
              <p className="text-6xl font-bold text-foreground mb-4 tracking-tight neon-text">{result.bmi}</p>
              <div className={cn("inline-block px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider mb-6", result.color)}>
                {result.category}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.category === 'Normal weight' 
                  ? 'Great job! You are in a healthy weight range. Maintain a balanced diet and regular exercise.'
                  : 'Consider consulting a nutritionist or doctor to discuss a healthy weight management plan.'}
              </p>
            </motion.div>
          ) : (
            <div className="text-center">
              <Calculator className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Enter your details to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMICalculator;

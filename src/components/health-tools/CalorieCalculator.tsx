import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CalorieCalculator: React.FC = () => {
  const { profile } = useAuth();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female'>((profile?.gender as any) || 'male');
  const [activity, setActivity] = useState('1.2');
  const [result, setResult] = useState<{ bmr: number; tdee: number } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    
    if (w > 0 && h > 0 && a > 0) {
      let bmr = 0;
      if (gender === 'male') {
        bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
      } else {
        bmr = (10 * w) + (6.25 * h) - (5 * a) - 161;
      }
      const tdee = bmr * parseFloat(activity);
      setResult({ bmr: Math.round(bmr), tdee: Math.round(tdee) });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Calorie Calculator</h2>
      <p className="text-muted-foreground mb-10">Estimate your daily calorie needs based on your activity level.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2">Gender</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-2xl outline-none text-foreground"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-2xl outline-none text-foreground"
                placeholder="Years"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-2xl outline-none text-foreground"
                placeholder="kg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-2xl outline-none text-foreground"
                placeholder="cm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Activity Level</label>
            <select 
              value={activity} 
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-2xl outline-none text-foreground"
            >
              <option value="1.2">Sedentary (little or no exercise)</option>
              <option value="1.375">Lightly active (light exercise 1-3 days/week)</option>
              <option value="1.55">Moderately active (moderate exercise 3-5 days/week)</option>
              <option value="1.725">Very active (hard exercise 6-7 days/week)</option>
              <option value="1.9">Extra active (very hard exercise & physical job)</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow"
          >
            Calculate Calories
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
                <p className="text-sm font-medium text-muted-foreground mb-2">Base Metabolic Rate (BMR)</p>
                <p className="text-4xl font-bold text-foreground tracking-tight">{result.bmr} <span className="text-lg font-normal text-muted-foreground">kcal/day</span></p>
              </div>
              <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20">
                <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Daily Maintenance (TDEE)</p>
                <p className="text-5xl font-bold text-foreground tracking-tight neon-text">{result.tdee}</p>
                <p className="text-xs text-muted-foreground mt-2">Calories needed to maintain current weight</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Weight Loss</p>
                  <p className="text-lg font-bold text-foreground">{result.tdee - 500}</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="text-xs font-bold text-blue-500 uppercase mb-1">Weight Gain</p>
                  <p className="text-lg font-bold text-foreground">{result.tdee + 500}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <Flame className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Enter your details to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalorieCalculator;

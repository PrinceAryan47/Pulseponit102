import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

const SleepCalculator: React.FC = () => {
  const [wakeTime, setWakeTime] = useState('07:00');
  const [result, setResult] = useState<string[] | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const [hours, minutes] = wakeTime.split(':').map(Number);
    const wakeDate = new Date();
    wakeDate.setHours(hours, minutes, 0, 0);
    
    const sleepTimes: string[] = [];
    // Calculate 6, 5, 4, and 3 cycles (90 mins each)
    // Plus 15 mins to fall asleep
    [6, 5, 4, 3].forEach(cycles => {
      const time = new Date(wakeDate);
      time.setMinutes(time.getMinutes() - (cycles * 90) - 15);
      sleepTimes.push(time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    });
    
    setResult(sleepTimes);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Sleep Calculator</h2>
      <p className="text-muted-foreground mb-10">Find the best time to go to bed to wake up feeling refreshed.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">I want to wake up at:</label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl outline-none text-foreground"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow"
          >
            Calculate Bedtime
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-muted/50 rounded-3xl border border-border">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center w-full"
            >
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Moon className="w-10 h-10 text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-4">You should try to fall asleep at one of these times:</p>
              <div className="grid grid-cols-2 gap-3">
                {result.map((time, i) => (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border transition-all",
                    i === 1 ? "bg-primary/10 border-primary/20 shadow-lg shadow-primary/5" : "bg-card border-border"
                  )}>
                    <p className={cn("text-lg font-bold", i === 1 ? "text-primary" : "text-foreground")}>{time}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{6-i} Cycles</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
                A good night's sleep consists of 5-6 complete sleep cycles. We've included 15 minutes to help you fall asleep.
              </p>
            </motion.div>
          ) : (
            <div className="text-center">
              <Moon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Select your wake-up time to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SleepCalculator;

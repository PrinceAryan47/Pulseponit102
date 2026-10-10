import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Activity, 
  Calculator, 
  Stethoscope, 
  ChevronRight,
  Droplets,
  Heart,
  Baby,
  Flame,
  Moon,
  Flower,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestOverlay from '../components/GuestOverlay';

// Code-split modular health tools with React.lazy to reduce bundle size
const BMICalculator = lazy(() => import('../components/health-tools/BMICalculator'));
const SymptomChecker = lazy(() => import('../components/health-tools/SymptomChecker'));
const CalorieCalculator = lazy(() => import('../components/health-tools/CalorieCalculator'));
const WaterCalculator = lazy(() => import('../components/health-tools/WaterCalculator'));
const HeartRateCalculator = lazy(() => import('../components/health-tools/HeartRateCalculator'));
const PregnancyCalculator = lazy(() => import('../components/health-tools/PregnancyCalculator'));
const PeriodTracker = lazy(() => import('../components/health-tools/PeriodTracker'));
const MensHealthGuide = lazy(() => import('../components/health-tools/MensHealthGuide'));
const SleepCalculator = lazy(() => import('../components/health-tools/SleepCalculator'));
const FitnessWorkoutTool = lazy(() => import('../components/health-tools/FitnessWorkoutTool'));

const ToolLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground space-y-4">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
    <p className="text-sm font-semibold tracking-wide">Loading health utility module...</p>
  </div>
);

const HealthTools: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<'bmi' | 'symptom' | 'calorie' | 'water' | 'heart' | 'pregnancy' | 'period' | 'sleep' | 'fitness' | 'mens-health'>(() => {
    const toolParam = searchParams.get('tool');
    const validTools = ['bmi', 'symptom', 'calorie', 'water', 'heart', 'pregnancy', 'period', 'sleep', 'fitness', 'mens-health'];
    if (toolParam && validTools.includes(toolParam)) {
      return toolParam as any;
    }
    return 'bmi';
  });
  const [activeCategory, setActiveCategory] = useState<'all' | 'men' | 'women'>('all');
  const { profile } = useAuth();

  useEffect(() => {
    const toolParam = searchParams.get('tool');
    const validTools = ['bmi', 'symptom', 'calorie', 'water', 'heart', 'pregnancy', 'period', 'sleep', 'fitness', 'mens-health'];
    if (toolParam && validTools.includes(toolParam)) {
      setActiveTool(toolParam as any);
      // Automatically adjust category if the tool is gender-specific
      const isFemaleTool = ['pregnancy', 'period'].includes(toolParam);
      const isMaleTool = ['mens-health'].includes(toolParam);
      if (isFemaleTool) setActiveCategory('women');
      else if (isMaleTool) setActiveCategory('men');
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile?.gender === 'female') {
      setActiveCategory('women');
    } else if (profile?.gender === 'male') {
      setActiveCategory('men');
    }
  }, [profile?.gender]);

  const tools = [
    { id: 'bmi', label: 'BMI Calculator', icon: Calculator, category: 'all' },
    { id: 'symptom', label: 'Symptom Checker', icon: Stethoscope, category: 'all' },
    { id: 'calorie', label: 'Calorie Calculator', icon: Flame, category: 'all' },
    { id: 'water', label: 'Water Intake', icon: Droplets, category: 'all' },
    { id: 'heart', label: 'Heart Rate', icon: Heart, category: 'all' },
    { id: 'pregnancy', label: 'Pregnancy Due Date', icon: Baby, category: 'women' },
    { id: 'period', label: 'Period Tracker', icon: Flower, category: 'women' },
    { id: 'mens-health', label: "Men's Health Guide", icon: Activity, category: 'men' },
    { id: 'sleep', label: 'Sleep Calculator', icon: Moon, category: 'all' },
    { id: 'fitness', label: 'Fitness Workout', icon: Activity, category: 'all' },
  ];

  const filteredTools = tools.filter(t => 
    activeCategory === 'all' || t.category === 'all' || t.category === activeCategory
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight neon-text">Health Utilities</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Use our professional health tools to monitor your body metrics and understand your symptoms better.
          </p>
        </div>

        <div className="flex bg-card p-1.5 rounded-2xl border border-border shadow-sm">
          {[
            { id: 'all', label: 'General' },
            { id: 'men', label: "Men's Health" },
            { id: 'women', label: "Women's Health" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tool Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {filteredTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all text-left",
                activeTool === tool.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-2 neon-glow" 
                  : "bg-card text-muted-foreground hover:bg-muted border border-border"
              )}
            >
              <tool.icon className="w-5 h-5" />
              {tool.label}
              {activeTool === tool.id && <ChevronRight className="ml-auto w-4 h-4" />}
            </button>
          ))}
        </div>

        {/* Tool Content */}
        <div className="lg:col-span-3">
          <GuestOverlay 
            title="Sign in to use health tools"
            description="Join PulsePoint to access AI-powered symptom analysis, personalized workout plans, and health calculators."
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-[2.5rem] shadow-xl border border-border p-8 lg:p-12 min-h-[500px]"
              >
                <Suspense fallback={<ToolLoadingFallback />}>
                  {activeTool === 'bmi' && <BMICalculator />}
                  {activeTool === 'symptom' && <SymptomChecker />}
                  {activeTool === 'calorie' && <CalorieCalculator />}
                  {activeTool === 'water' && <WaterCalculator />}
                  {activeTool === 'heart' && <HeartRateCalculator />}
                  {activeTool === 'pregnancy' && <PregnancyCalculator />}
                  {activeTool === 'period' && <PeriodTracker />}
                  {activeTool === 'mens-health' && <MensHealthGuide />}
                  {activeTool === 'sleep' && <SleepCalculator />}
                  {activeTool === 'fitness' && <FitnessWorkoutTool />}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </GuestOverlay>
        </div>
      </div>
    </div>
  );
};

export default HealthTools;

import React, { useState } from 'react';
import { 
  Activity, 
  Calculator, 
  Stethoscope, 
  Info, 
  ChevronRight,
  Droplets,
  Heart,
  Baby,
  Flame,
  Moon,
  Flower
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "../services/aiService";
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestOverlay from '../components/GuestOverlay';

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

  React.useEffect(() => {
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

  React.useEffect(() => {
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
              </motion.div>
            </AnimatePresence>
          </GuestOverlay>
        </div>
      </div>
    </div>
  );
};

const MensHealthGuide = () => {
  const { profile } = useAuth();
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);

  const generateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age) return;
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `As a professional health consultant, provide a comprehensive health screening and wellness guide for a male patient aged ${age}.
        
        Include:
        1. Recommended screenings (e.g., prostate, colon, heart health) based on age.
        2. Common health risks for men in this age group.
        3. Lifestyle and nutrition tips for optimal male health.
        4. Mental health considerations.
        
        Format the response using professional Markdown with clear headings and bullet points.`,
      });
      setGuide(response.text || "Unable to generate guide at this time.");
    } catch (err) {
      console.error(err);
      setGuide("Error connecting to health analysis service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Men's Health & Screening Guide</h2>
      <p className="text-muted-foreground mb-10">Get personalized health screening recommendations and wellness tips for men.</p>
      
      <form onSubmit={generateGuide} className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-semibold text-foreground/70 mb-2">Your Age</label>
          <input
            type="number"
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
            placeholder="e.g. 45"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 neon-glow"
        >
          {loading ? 'Generating Guide...' : 'Generate Health Guide'}
          <Activity className="w-5 h-5" />
        </button>
      </form>

      {guide && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-8 bg-muted/50 rounded-[2rem] border border-border prose dark:prose-invert max-w-none"
        >
          <Markdown>{guide}</Markdown>
        </motion.div>
      )}
    </div>
  );
};

const FitnessWorkoutTool = () => {
  const { profile } = useAuth();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [gender, setGender] = useState(profile?.gender || 'male');
  const [goal, setGoal] = useState('weight-loss');
  const [level, setLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [routine, setRoutine] = useState<string | null>(null);

  const generateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height || !age) return;
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `As a professional fitness trainer, create a personalized weekly workout routine for a patient with the following details:
        
        Details:
        - Age: ${age}
        - Gender: ${gender}
        - Weight: ${weight} kg
        - Height: ${height} cm
        - Fitness Goal: ${goal}
        - Fitness Level: ${level}

        Provide a clear, structured weekly routine including:
        1. Warm-up exercises.
        2. Main workout exercises (sets, reps, and brief instructions).
        3. Cool-down/Stretching.
        4. Nutritional tips related to their goal.
        
        Format the response using professional Markdown with clear headings and bullet points.`,
      });
      setRoutine(response.text || "Unable to generate routine at this time.");
    } catch (err) {
      console.error(err);
      setRoutine("Error connecting to fitness analysis service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Personalized Fitness Planner</h2>
      <p className="text-muted-foreground mb-10">Get a custom workout routine tailored to your body metrics and fitness goals.</p>
      
      <form onSubmit={generateWorkout} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
              placeholder="e.g. 25"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
              placeholder="e.g. 70"
              required
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
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Fitness Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
            >
              <option value="weight-loss">Weight Loss</option>
              <option value="muscle-gain">Muscle Gain</option>
              <option value="endurance">Endurance</option>
              <option value="flexibility">Flexibility</option>
              <option value="general-health">General Health</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2">Fitness Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 neon-glow"
        >
          {loading ? 'Generating Routine...' : 'Generate Workout Routine'}
        </button>
      </form>

      {routine && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-8 bg-muted/50 rounded-3xl border border-border max-w-none"
        >
          <div className="flex items-center gap-2 mb-6 text-primary">
            <Activity className="w-5 h-5" />
            <h3 className="text-lg font-bold m-0 neon-text">Your Personalized Routine</h3>
          </div>
          <div className="markdown-body text-foreground/80 leading-relaxed">
            <Markdown>{routine}</Markdown>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const BMICalculator = () => {
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

const SymptomChecker = () => {
  const { profile } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [gender, setGender] = useState(profile?.gender || 'male');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('5');
  const [history, setHistory] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const checkSymptoms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `As a medical symptom checker assistant, analyze the following patient information for potential health insights:
        
        Patient Details:
        - Age: ${age}
        - Gender: ${gender}
        - Primary Symptoms: ${symptoms}
        - Duration: ${duration}
        - Severity (1-10): ${severity}
        - Medical History/Allergies: ${history || 'None reported'}

        Provide a detailed analysis including:
        1. Potential health conditions (clearly state these are possibilities, not a diagnosis).
        2. Recommended next steps (e.g., specific tests to discuss with a doctor, lifestyle changes, or urgent care if necessary).
        3. Questions the patient should ask their healthcare provider.
        
        Format the response using professional Markdown with clear headings and bullet points.`,
      });
      setAnalysis(response.text || "Unable to analyze symptoms at this time.");
    } catch (err) {
      console.error(err);
      setAnalysis("Error connecting to health analysis service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">Advanced Symptom Checker</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-10">Provide detailed information to receive a more accurate health analysis.</p>
      
      <form onSubmit={checkSymptoms} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
              placeholder="e.g. 25"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">How long have you had these symptoms?</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
              placeholder="e.g. 3 days, 2 weeks"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Severity (1-10)</label>
            <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="flex-grow h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
              />
              <span className="font-bold text-neon-blue w-4">{severity}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Primary Symptoms</label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all min-h-[120px] resize-none text-[rgb(var(--foreground))]"
            placeholder="Describe your symptoms in detail..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Medical History / Allergies (Optional)</label>
          <textarea
            value={history}
            onChange={(e) => setHistory(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all min-h-[100px] resize-none text-[rgb(var(--foreground))]"
            placeholder="e.g. Asthma, allergic to penicillin..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 disabled:opacity-50 neon-glow"
        >
          {loading ? 'Analyzing Data...' : 'Get Detailed Analysis'}
        </button>
      </form>

      {analysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 max-w-none"
        >
          <div className="flex items-center gap-2 mb-6 text-neon-blue">
            <Info className="w-5 h-5" />
            <h3 className="text-lg font-bold m-0 neon-text">Analysis Results</h3>
          </div>
          <div className="markdown-body text-slate-700 dark:text-slate-300 leading-relaxed">
            <Markdown>{analysis}</Markdown>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const CalorieCalculator = () => {
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
      <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">Calorie Calculator</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-10">Estimate your daily calorie needs based on your activity level.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Gender</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
                placeholder="Years"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
                placeholder="kg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
                placeholder="cm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Activity Level</label>
            <select 
              value={activity} 
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
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
            className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 neon-glow"
          >
            Calculate Calories
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center w-full"
            >
              <div className="mb-8">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Base Metabolic Rate (BMR)</p>
                <p className="text-4xl font-bold text-[rgb(var(--foreground))] tracking-tight">{result.bmr} <span className="text-lg font-normal text-slate-400">kcal/day</span></p>
              </div>
              <div className="p-6 bg-neon-blue/10 rounded-2xl border border-neon-blue/20">
                <p className="text-sm font-bold text-neon-blue uppercase tracking-widest mb-2">Daily Maintenance (TDEE)</p>
                <p className="text-5xl font-bold text-[rgb(var(--foreground))] tracking-tight neon-text">{result.tdee}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Calories needed to maintain current weight</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Weight Loss</p>
                  <p className="text-lg font-bold text-[rgb(var(--foreground))]">{result.tdee - 500}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-bold text-blue-500 uppercase mb-1">Weight Gain</p>
                  <p className="text-lg font-bold text-[rgb(var(--foreground))]">{result.tdee + 500}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <Flame className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Enter your details to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WaterCalculator = () => {
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
      <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">Water Intake Calculator</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-10">Calculate how much water you should drink daily based on your weight.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
              placeholder="e.g. 70"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 neon-glow"
          >
            Calculate Intake
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Droplets className="w-10 h-10 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Recommended Daily Intake</p>
              <p className="text-6xl font-bold text-[rgb(var(--foreground))] mb-4 tracking-tight neon-text">{result} <span className="text-2xl font-normal text-slate-400">Liters</span></p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                That's approximately {Math.round(result * 4)} glasses (250ml each) per day.
              </p>
            </motion.div>
          ) : (
            <div className="text-center">
              <Droplets className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Enter your weight to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HeartRateCalculator = () => {
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
      <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">Heart Rate Checker</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-10">Determine your maximum heart rate and target zones for exercise.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Age (years)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
              placeholder="e.g. 30"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 neon-glow"
          >
            Calculate Zones
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center w-full"
            >
              <div className="mb-8">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Max Heart Rate</p>
                <p className="text-4xl font-bold text-[rgb(var(--foreground))] tracking-tight">{result.max} <span className="text-lg font-normal text-slate-400">bpm</span></p>
              </div>
              <div className="p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                <p className="text-sm font-bold text-red-500 uppercase tracking-widest mb-2">Target Training Zone</p>
                <p className="text-4xl font-bold text-[rgb(var(--foreground))] tracking-tight neon-text">{result.targetMin} - {result.targetMax}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">50% to 85% of maximum heart rate</p>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <Heart className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Enter your age to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PregnancyCalculator = () => {
  const [lmp, setLmp] = useState('');
  const [result, setResult] = useState<{ dueDate: string; weeks: number } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lmp) return;
    
    const date = new Date(lmp);
    // Naegele's Rule: LMP + 7 days - 3 months + 1 year
    const dueDate = new Date(date);
    dueDate.setDate(dueDate.getDate() + 7);
    dueDate.setMonth(dueDate.getMonth() + 9); // Equivalent to -3 months + 1 year
    
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
      <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">Pregnancy Due Date</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-10">Estimate your due date based on your last menstrual period (LMP).</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Last Period Start Date</label>
            <input
              type="date"
              value={lmp}
              onChange={(e) => setLmp(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 neon-glow"
          >
            Calculate Due Date
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center w-full"
            >
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Baby className="w-10 h-10 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Estimated Due Date</p>
              <p className="text-4xl font-bold text-[rgb(var(--foreground))] mb-6 tracking-tight neon-text">{result.dueDate}</p>
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Progress</p>
                <p className="text-xl font-bold text-[rgb(var(--foreground))]">Week {result.weeks}</p>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <Baby className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Select your LMP date to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PeriodTracker = () => {
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
      <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">Period Tracker</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-10">Track your menstrual cycle and estimate your next period and ovulation dates.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Last Period Start Date</label>
            <input
              type="date"
              value={lmp}
              onChange={(e) => setLmp(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Average Cycle Length (days)</label>
            <input
              type="number"
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
              placeholder="e.g. 28"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 neon-glow"
          >
            Track Cycle
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
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
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Next Period Expected</p>
                  <p className="text-3xl font-bold text-[rgb(var(--foreground))] tracking-tight neon-text">{result.nextPeriod}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Ovulation</p>
                  <p className="text-xl font-bold text-pink-500">{result.ovulation}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <Flower className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Enter your cycle details to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SleepCalculator = () => {
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
      <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">Sleep Calculator</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-10">Find the best time to go to bed to wake up feeling refreshed.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={calculate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">I want to wake up at:</label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-[rgb(var(--foreground))]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 neon-glow"
          >
            Calculate Bedtime
          </button>
        </form>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
          {result ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center w-full"
            >
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Moon className="w-10 h-10 text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">You should try to fall asleep at one of these times:</p>
              <div className="grid grid-cols-2 gap-3">
                {result.map((time, i) => (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border transition-all",
                    i === 1 ? "bg-neon-blue/10 border-neon-blue/20 shadow-lg shadow-neon-blue/5" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                  )}>
                    <p className={cn("text-lg font-bold", i === 1 ? "text-neon-blue" : "text-[rgb(var(--foreground))]")}>{time}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{6-i} Cycles</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-6 leading-relaxed">
                A good night's sleep consists of 5-6 complete sleep cycles. We've included 15 minutes to help you fall asleep.
              </p>
            </motion.div>
          ) : (
            <div className="text-center">
              <Moon className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Select your wake-up time to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthTools;

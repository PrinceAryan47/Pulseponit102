import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Trash2, 
  CheckCircle2, 
  Shield, 
  Sparkles, 
  FileDown, 
  Printer, 
  Compass, 
  Droplets, 
  TrendingUp, 
  BookOpen 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { generateFitnessWorkoutFallback } from '../../utils/offlineHealthData';
import { GoogleGenAI } from '../../services/aiService';
import { cn } from '../../lib/utils';
import { exportFitnessPlanDocx } from '../../utils/docxExport';

export const WorkoutTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSets, setTotalSets] = useState(4);
  const [currentSet, setCurrentSet] = useState(1);
  const [timerType, setTimerType] = useState<'work' | 'rest'>('work');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (timerType === 'work') {
        setTimerType('rest');
        setTimeLeft(45);
      } else {
        setTimerType('work');
        setTimeLeft(60);
        if (currentSet < totalSets) {
          setCurrentSet(prev => prev + 1);
        } else {
          setIsRunning(false);
          setCurrentSet(1);
        }
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, timerType, currentSet, totalSets]);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(60);
    setCurrentSet(1);
    setTimerType('work');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-card border border-border p-6 rounded-3xl mt-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm select-none">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Activity className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <div>
          <h4 className="font-bold text-base text-foreground uppercase tracking-wider">Workout Interval Buddy</h4>
          <p className="text-xs text-muted-foreground">Keep pace between your training sets to maximize hypertrophy and glycogen capacity.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Set</span>
          <span className="text-2xl font-black text-foreground leading-none">{currentSet} <span className="text-sm text-muted-foreground/60">/ {totalSets}</span></span>
        </div>

        <div className="flex flex-col items-center px-6 py-1 border-l border-r border-border min-w-[125px]">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-1",
            timerType === 'work' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
          )}>
            {timerType === 'work' ? "Lift Set" : "Rest Break"}
          </span>
          <span className="text-3xl font-black font-mono tracking-tighter text-foreground leading-none">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer",
              isRunning ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export const FitnessWorkoutTool: React.FC = () => {
  const { profile, user } = useAuth();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [gender, setGender] = useState(profile?.gender || 'male');
  const [goal, setGoal] = useState('weight-loss');
  const [level, setLevel] = useState('beginner');
  const [days, setDays] = useState('4');
  const [equipment, setEquipment] = useState('gym');
  const [loading, setLoading] = useState(false);
  const [routine, setRoutine] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'nutrition' | 'progression' | 'full'>('schedule');
  const [loadedSource, setLoadedSource] = useState<'ai' | 'fallback' | 'database' | null>(null);

  // Firestore History states
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch Saved Reports History
  const fetchHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const q = query(
        collection(db, 'healthReports'),
        where('userId', '==', user.uid),
        where('type', '==', 'fitness-workout'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const reports = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedReports(reports);
    } catch (err) {
      console.error("Error fetching fitness history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  // Load a report from history
  const loadReport = (report: any) => {
    setAge(report.inputCriteria?.age?.toString() || '');
    setGender(report.inputCriteria?.gender || 'male');
    setWeight(report.inputCriteria?.weight?.toString() || '');
    setHeight(report.inputCriteria?.height?.toString() || '');
    setGoal(report.inputCriteria?.goal || 'weight-loss');
    setLevel(report.inputCriteria?.level || 'beginner');
    setDays(report.inputCriteria?.days?.toString() || '4');
    setEquipment(report.inputCriteria?.equipment || 'gym');
    setRoutine(report.reportText);
    setLoadedSource('database');
    setCompletedWorkouts({});
  };

  // Delete a report from history
  const deleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved workout program?")) return;
    try {
      await deleteDoc(doc(db, 'healthReports', reportId));
      setSavedReports(prev => prev.filter(r => r.id !== reportId));
      if (routine && savedReports.find(r => r.id === reportId)?.reportText === routine) {
        setRoutine(null);
        setLoadedSource(null);
      }
    } catch (err) {
      console.error("Error deleting fitness report:", err);
    }
  };

  const [completedWorkouts, setCompletedWorkouts] = useState<Record<string, boolean>>({});

  const toggleWorkoutDay = (dayKey: string) => {
    setCompletedWorkouts(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const downloadWorkoutAsDocx = async () => {
    if (!routine) return;
    try {
      await exportFitnessPlanDocx({
        goal,
        days: parseInt(days, 10) || 4,
        fitnessLevel: level,
        routine
      });
    } catch (docxErr) {
      console.error("Failed to generate Word document:", docxErr);
      alert("Failed to export Word document. Please print instead.");
    }
  };

  const parseSections = (markdown: string) => {
    const sectionsList: { title: string; content: string }[] = [];
    const parts = markdown.split(/^(##\s+.*)/m);
    
    if (parts[0] && parts[0].trim()) {
      sectionsList.push({ title: "Introduction & Overview", content: parts[0].trim() });
    }
    
    for (let i = 1; i < parts.length; i += 2) {
      const heading = parts[i].replace(/^##\s+/, '').trim();
      const content = parts[i + 1] ? parts[i + 1].trim() : "";
      sectionsList.push({ title: heading, content });
    }
    
    if (sectionsList.length === 0) {
      sectionsList.push({ title: "Custom Workout & Nutrition Plan", content: markdown });
    }
    
    return sectionsList;
  };

  const generateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height || !age) return;
    
    setLoading(true);
    setRoutine(null);
    setLoadedSource(null);

    let generatedText = "";
    let sourceUsed: 'ai' | 'fallback' = 'ai';

    try {
      const ai = new GoogleGenAI({ apiKey: "" });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `As an elite strength and conditioning specialist (CSCS) and registered sports dietitian conforming to authoritative professional guidelines (such as the American College of Sports Medicine (ACSM) for exercise prescription, the National Strength and Conditioning Association (NSCA) for progressive training, and the International Society of Sports Nutrition (ISSN) for nutrient timing), create a personalized weekly gym program and nutritional plan.
        
        Client Details:
        - Age: ${age}
        - Biological Gender: ${gender}
        - Weight: ${weight} kg
        - Height: ${height} cm
        - Core Fitness Goal: ${goal}
        - Experience Level: ${level}
        - Committed Days per Week: ${days} days
        - Available Training Environment: ${equipment === 'gym' ? 'Fully equipped commercial gym' : equipment === 'home' ? 'Dumbbells and basic resistance bands' : 'No equipment / Pure bodyweight training'}

        Please construct a comprehensive and professional Markdown routine including:
        
        # ${goal.toUpperCase().replace('-', ' ')} WORKOUT PLATFORM
        
        ## 🗓️ Weekly Training Frequency Split (${days}-Day Split)
        Provide a concise summary table or overview of what is trained on each active training day (e.g. Day 1: Upper Push, Day 2: Lower Body, Day 3: Active Rest etc.) based on their level (${level}) and equipment (${equipment}).
        
        ## 🏋️ Routine Step-by-Step Breakdown
        For EACH active workout day, outline:
        - **Warm-Up Protocol**: 3-5 minutes of specific dynamic mobility warm-ups to shield joints from injury, citing ACSM mobility standards.
        - **Main Workout block**: Specific compound and isolation exercises detailing exact target Sets, Reps, Intensity (RPE), and 1-sentence execution instructions.
        - **Cool-Down / Flexibility Plan**: 2-3 minutes of static stretches.
        
        ## 🥗 Nutrition & Fueling Protocols
        Tailor a calorie-conscious nutrition guide specifically for the goal: ${goal}. Detail target macronutrient distributions, optimal hydration strategies, and ideal pre- and post-workout fuel examples aligned with ISSN metabolic timing guidelines.
        
        ## 📈 Progression & Recovery Philosophy
        Scientific advice on progressive overload (how to build strength or stamina over weeks), required rest periods, and active recovery metrics.
        
        ## 📚 Scientific References & Sports Science Sources
        Provide a distinct sports-science reference index pointing to ACSM physical guidelines, NSCA Strength Standards, and ISSN Nutrition Positions so the client has an educational reference directory.`,
      });
      
      if (response.text) {
        generatedText = response.text;
        sourceUsed = 'ai';
      } else {
        throw new Error("Empty response from AI engine.");
      }
    } catch (err) {
      console.warn("AI workout generation failed. Proceeding with robust, customized sports-science local generator.", err);
      generatedText = generateFitnessWorkoutFallback({
        age: parseInt(age, 10) || 25,
        gender,
        weight: parseFloat(weight) || 70,
        height: parseFloat(height) || 175,
        goal,
        level,
        days: parseInt(days, 10) || 4,
        equipment
      });
      sourceUsed = 'fallback';
    } finally {
      setRoutine(generatedText);
      setLoadedSource(sourceUsed);
      setLoading(false);
      setCompletedWorkouts({});

      if (generatedText && user) {
        try {
          await addDoc(collection(db, 'healthReports'), {
            userId: user.uid,
            type: 'fitness-workout',
            inputCriteria: { age: parseInt(age, 10) || 25, gender, weight: parseFloat(weight) || 70, height: parseFloat(height) || 175, goal, level, days: parseInt(days, 10) || 4, equipment },
            reportText: generatedText,
            createdAt: new Date().toISOString()
          });
          fetchHistory();
        } catch (saveErr) {
          console.error("Error persisting generated fitness plan to DB:", saveErr);
        }
      }
    }
  };

  const parsedDaysNum = parseInt(days, 10) || 4;

  return (
    <div>
      <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2.5">
        <Activity className="w-8 h-8 text-primary" />
        Personalized Fitness Planner
      </h2>
      <p className="text-muted-foreground mb-6 leading-relaxed max-w-2xl text-sm">
        Generate custom splits, precise exercise programs, and elite nutritional guides matched directly to your biometrics.
      </p>
      
      <div className="bg-blue-500/10 border border-blue-500/25 p-5 rounded-3xl mb-8 flex flex-col sm:flex-row gap-4 items-start">
        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-blue-800 dark:text-blue-400 mb-1">Accredited Sports Science Criteria</h4>
          <p className="text-xs text-blue-700/85 dark:text-slate-300 leading-relaxed mb-3">
            Our workout routines, macro equations, and resistance schedules are fully guided by peer-reviewed athletic standards and sports medicine guidelines:
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-black tracking-wider uppercase">
            <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-800 dark:text-blue-300">ACSM Exercise Guidelines</span>
            <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-800 dark:text-blue-300">NSCA Progressive Overload</span>
            <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-800 dark:text-blue-300">ISSN Nutrient Timing Standards</span>
            <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-800 dark:text-blue-300">Harvard T.H. Chan Wellness</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={generateWorkout} className={cn("space-y-6 bg-muted/20 p-6 sm:p-8 rounded-3xl border border-border/80", user ? "lg:col-span-8" : "lg:col-span-12")}>
          <h3 className="font-bold text-sm text-foreground uppercase tracking-widest pb-2 border-b border-border/60">1. Body Metrics & Variables</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-foreground/85 uppercase tracking-widest mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-medium"
                placeholder="e.g. 25"
                required
                min="1"
                max="120"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/85 uppercase tracking-widest mb-2">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-medium"
                placeholder="e.g. 70"
                required
                min="20"
                max="300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/85 uppercase tracking-widest mb-2">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-medium"
                placeholder="e.g. 175"
                required
                min="50"
                max="250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/85 uppercase tracking-widest mb-2">Biological Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-semibold"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <h3 className="font-bold text-sm text-foreground pt-4 pb-2 border-b border-border/60 uppercase tracking-widest">2. Training Design & Goal Setting</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-foreground/85 uppercase tracking-widest mb-2">Fitness Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-semibold"
              >
                <option value="weight-loss">Weight Loss & Fat Reduction</option>
                <option value="muscle-gain">Muscle Hypertrophy & Strength</option>
                <option value="endurance">Cardiovascular Endurance</option>
                <option value="flexibility">Joint Mobility & Flexibility</option>
                <option value="general-health">Overall Longevity & Health</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/85 uppercase tracking-widest mb-2">Fitness Experience</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-semibold"
              >
                <option value="beginner">Beginner (under 6 months)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="advanced">Advanced (highly consistent athlete)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/85 uppercase tracking-widest mb-2">Active Workout Days</label>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-semibold"
              >
                <option value="2">2 Days (Essential Balance)</option>
                <option value="3">3 Days (Classic Push / Pull / Legs)</option>
                <option value="4">4 Days (Efficient Routine)</option>
                <option value="5">5 Days (Highly Commended Split)</option>
                <option value="6">6 Days (Advanced High Volume)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/85 uppercase tracking-widest mb-2">Training Environment</label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-semibold"
              >
                <option value="bodyweight">No Equipment (Pure Calisthenics)</option>
                <option value="home">Home Setup (Dumbbells/Bands)</option>
                <option value="gym">Commercial Gym (Full Equipment)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 neon-glow text-xs uppercase tracking-wider cursor-pointer"
          >
            {loading ? 'Assembling Weekly Program...' : 'Generate Workout Routine'}
          </button>
        </form>

        {user && (
          <div className="lg:col-span-4 bg-muted/30 p-6 sm:p-8 rounded-3xl border border-border/80">
            <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>📂 Saved Workout Programs</span>
              {historyLoading && <span className="text-[10px] text-muted-foreground animate-pulse font-normal">Loading...</span>}
            </h3>
            {savedReports.length === 0 ? (
              <p className="text-xs text-muted-foreground italic leading-relaxed">No saved programs yet. Create a program to save it automatically in the database.</p>
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => loadReport(report)}
                    className={cn(
                      "group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none text-left",
                      routine === report.reportText
                        ? "bg-primary/5 border-primary/40"
                        : "border-border/60 bg-background/50 hover:bg-background hover:border-border"
                    )}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-tight text-primary">
                          {report.inputCriteria?.days}-Day Split
                        </span>
                        <span className="text-[9px] text-muted-foreground">• {new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-bold text-foreground truncate capitalize">
                        Goal: {report.inputCriteria?.goal?.replace('-', ' ')}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {report.inputCriteria?.level} • {report.inputCriteria?.weight}kg / {report.inputCriteria?.height}cm
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteReport(report.id, e)}
                      className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                      title="Delete from database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {routine && (() => {
        const sections = parseSections(routine);
        const scheduleSections = sections.filter(s => 
          s.title.toLowerCase().includes('split') || 
          s.title.toLowerCase().includes('breakdown') || 
          s.title.toLowerCase().includes('training') || 
          s.title.toLowerCase().includes('routine') ||
          s.title.toLowerCase().includes('introduction')
        );
        const nutritionSections = sections.filter(s => 
          s.title.toLowerCase().includes('nutrition') || 
          s.title.toLowerCase().includes('fueling') || 
          s.title.toLowerCase().includes('diet') || 
          s.title.toLowerCase().includes('meal')
        );
        const progressionSections = sections.filter(s => 
          s.title.toLowerCase().includes('progression') || 
          s.title.toLowerCase().includes('recovery') || 
          s.title.toLowerCase().includes('reference') || 
          s.title.toLowerCase().includes('science') || 
          s.title.toLowerCase().includes('sources')
        );

        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-8"
          >
            <div className="bg-card border-2 border-primary/20 p-6 sm:p-8 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-md">
                    Word Document Export Ready
                  </span>
                  {loadedSource === 'database' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 rounded-md">
                      <CheckCircle2 className="w-3 h-3" /> DB Loaded
                    </span>
                  )}
                  {loadedSource === 'fallback' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border text-[10px] font-bold text-muted-foreground rounded-md">
                      <Shield className="w-3 h-3" /> Offline
                    </span>
                  )}
                  {loadedSource === 'ai' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-500 rounded-md">
                      <Sparkles className="w-3 h-3" /> Live AI Generated
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-xl text-foreground">Download Your Plan</h3>
                <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                  We have generated a clinical-grade formatted Word (.docx) document complete with custom headings, formatted bullet lists, and structured training splits ready to read, print or save offline!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={downloadWorkoutAsDocx}
                  className="w-full sm:w-auto px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-600/20 hover:scale-[1.02] cursor-pointer"
                >
                  <FileDown className="w-5 h-5" />
                  Download Word (.docx)
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-6 py-4 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Printer className="w-5 h-5" />
                  Print Program
                </button>
              </div>
            </div>

            <div className="bg-muted/30 p-6 sm:p-8 rounded-[2rem] border border-border/80">
              <h3 className="font-bold text-base text-foreground mb-1">Your Interactive Split Tracker</h3>
              <p className="text-xs text-muted-foreground mb-6">Tick off training days as you complete them to record your weekly progression metrics:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: parsedDaysNum }).map((_, idx) => {
                  const dayId = `day-${idx + 1}`;
                  return (
                    <div
                      key={dayId}
                      onClick={() => toggleWorkoutDay(dayId)}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between",
                        completedWorkouts[dayId]
                          ? "bg-emerald-500/10 border-emerald-500/25 text-foreground"
                          : "bg-background border-border hover:border-border"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground">Session {idx + 1}</span>
                        <span className="text-sm font-bold mt-0.5">Active Routine</span>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-lg border flex items-center justify-center font-bold text-xs transition-all",
                        completedWorkouts[dayId]
                          ? "bg-emerald-500 border-emerald-500 text-white animate-bounce"
                          : "border-muted-foreground/30 text-transparent"
                      )}>
                        ✓
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <WorkoutTimer />

            <div className="space-y-6">
              <div className="flex flex-wrap border-b border-border gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('schedule')}
                  className={cn(
                    "px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer",
                    activeTab === 'schedule'
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Compass className="w-4 h-4" />
                  Training Splits ({scheduleSections.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('nutrition')}
                  className={cn(
                    "px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer",
                    activeTab === 'nutrition'
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Droplets className="w-4 h-4" />
                  Nutrition Protocols ({nutritionSections.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('progression')}
                  className={cn(
                    "px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer",
                    activeTab === 'progression'
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Progression & Reference ({progressionSections.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('full')}
                  className={cn(
                    "px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer",
                    activeTab === 'full'
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  Full Clinical Document
                </button>
              </div>

              <div className="space-y-6">
                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    {scheduleSections.length > 0 ? (
                      scheduleSections.map((sec, idx) => (
                        <div key={idx} className="p-8 bg-card border border-border rounded-[2.5rem] shadow-sm">
                          <div className="flex items-center gap-2.5 mb-6 text-primary border-b border-border/60 pb-3">
                            <Compass className="w-5 h-5" />
                            <h4 className="font-black text-sm uppercase tracking-widest text-foreground m-0">{sec.title}</h4>
                          </div>
                          <div className="markdown-body text-foreground/90 leading-relaxed prose dark:prose-invert max-w-none">
                            <Markdown>{sec.content}</Markdown>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 bg-muted/20 border border-border rounded-[2.5rem] text-center text-muted-foreground text-sm">
                        Workout splits are available in the full document view.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'nutrition' && (
                  <div className="space-y-6">
                    {nutritionSections.length > 0 ? (
                      nutritionSections.map((sec, idx) => (
                        <div key={idx} className="p-8 bg-card border border-border rounded-[2.5rem] shadow-sm">
                          <div className="flex items-center gap-2.5 mb-6 text-emerald-500 border-b border-border/60 pb-3">
                            <Droplets className="w-5 h-5" />
                            <h4 className="font-black text-sm uppercase tracking-widest text-foreground m-0">{sec.title}</h4>
                          </div>
                          <div className="markdown-body text-foreground/90 leading-relaxed prose dark:prose-invert max-w-none">
                            <Markdown>{sec.content}</Markdown>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 bg-muted/20 border border-border rounded-[2.5rem] text-center text-muted-foreground text-sm">
                        Nutrition protocols are available in the full document view.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'progression' && (
                  <div className="space-y-6">
                    {progressionSections.length > 0 ? (
                      progressionSections.map((sec, idx) => (
                        <div key={idx} className="p-8 bg-card border border-border rounded-[2.5rem] shadow-sm">
                          <div className="flex items-center gap-2.5 mb-6 text-indigo-500 border-b border-border/60 pb-3">
                            <TrendingUp className="w-5 h-5" />
                            <h4 className="font-black text-sm uppercase tracking-widest text-foreground m-0">{sec.title}</h4>
                          </div>
                          <div className="markdown-body text-foreground/90 leading-relaxed prose dark:prose-invert max-w-none">
                            <Markdown>{sec.content}</Markdown>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 bg-muted/20 border border-border rounded-[2.5rem] text-center text-muted-foreground text-sm">
                        Progression and sports medicine references are available in the full document view.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'full' && (
                  <div className="p-8 bg-muted/20 border border-border rounded-[2.5rem] max-w-none">
                    <div className="flex items-center justify-between mb-6 border-b border-border/80 pb-4 text-primary">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 animate-pulse" />
                        <h3 className="text-lg font-bold m-0 neon-text">Your Personalized Weekly Program</h3>
                      </div>
                    </div>
                    <div className="markdown-body text-foreground/90 leading-relaxed prose dark:prose-invert max-w-none">
                      <Markdown>{routine}</Markdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
};

export default FitnessWorkoutTool;

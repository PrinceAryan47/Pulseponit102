import React, { useState, useEffect } from 'react';
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
  const [focus, setFocus] = useState('overall');
  const [activity, setActivity] = useState('moderate');
  const [familyHistory, setFamilyHistory] = useState('none');
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);

  // Dynamic Client-side Screening Checklist based on age limits
  const getScreeningRecommendations = (currentAge: number) => {
    const list = [
      { id: 'bp', label: 'Blood Pressure Assessment', frequency: 'Annually', desc: 'Identify risks for hypertension and silent stroke indicators.', minAge: 18 },
      { id: 'lipids', label: 'Lipid Panel / Cholesterol Test', frequency: 'Every 4-6 years', desc: 'Assess cardiovascular lipid plaque build-ups.', minAge: 20 },
      { id: 'diabetes', label: 'Type 2 Diabetes Screening / HbA1c', frequency: 'Every 3 years', desc: 'Check metabolic blood sugar levels and insulin resistance.', minAge: 35 },
      { id: 'colon', label: 'Colorectal Cancer Screening / Colonoscopy', frequency: 'Every 5-10 years', desc: 'Detect precancerous colonic growths early.', minAge: 45 },
      { id: 'prostate', label: 'Prostate-Specific PSA Test & Consult', frequency: 'Annually / Consult Doctor', desc: 'Discuss screening pathways with your doctor.', minAge: 45 },
      { id: 'shingles', label: 'Shingles (Zoster) Vaccination', frequency: '2 doses', desc: 'Prevent long-term postherpetic nerve pains.', minAge: 50 },
      { id: 'pneumo', label: 'Pneumococcal Immunization', frequency: 'One-time', desc: 'Provides defense against acute bacterial pneumonias.', minAge: 65 }
    ];
    return list.filter(item => currentAge >= item.minAge);
  };

  const parsedAge = parseInt(age, 10) || 0;
  const screeningList = getScreeningRecommendations(parsedAge);

  // Simple local state to track checked screenings
  const [checkedScreenings, setCheckedScreenings] = useState<Record<string, boolean>>({});

  const toggleScreening = (id: string) => {
    setCheckedScreenings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age) return;
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: "" });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `As an expert clinical health consultant specializing in men's health, preventive care, and longevity medicine, create a comprehensive, highly personalized screening and wellness guide for a male patient.
        
        Patient Profile:
        - Age: ${age}
        - Primary Focus Area: ${focus}
        - Physical Activity Level: ${activity}
        - Family History / Risks: ${familyHistory}
        
        Provide a detailed health screening report in high-quality Markdown. Make sure it is structured as follows:
        
        # PERSONALIZED MEN'S PREVENTIVE HEALTH REPORT
        
        ## 📋 Recommended Screenings & Preventive Timeline
        Provide a customized, chronological list of mandatory and recommended medical screenings (e.g. Prostate-Specific Antigen (PSA) test, Colonoscopy, Lipid Panel, Blood Pressure, Cardiovascular scans etc.) based on this patient's age (${age} years) and profile risks. State the recommended starting frequency and what each test looks for.
        
        ## ⚠️ Key Health Risks & Vulnerabilities
        Identify specific physical and physiological risks associated with the ${age}-year-old bracket, factoring in the primary focus of "${focus}" and family history of "${familyHistory}".
        
        ## 🥗 Target Nutrition, Supplementation & Lifestyle Guidelines
        Deliver an evidence-based roadmap for daily life. Detail custom food groups to prioritize, key essential nutrients (like Omega-3, Vitamin D, Magnesium, Zinc etc.) if applicable, stress-mitigation patterns, and sleep hygiene adjustments.
        
        ## 🧠 Cognitive Support & Mental Health Considerations
        Specific age-appropriate mental wellness tips, focusing on managing work/life stressors, preventative neurology, and preserving peak cognitive focus with age.
        
        ## 🩺 Doctor Consultation Checklist
        Give the client 3-5 high-value, precise questions they can directly ask their primary care doctor during their next visit.`,
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
      <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2.5">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
        Men's Health & Screening Guide
      </h2>
      <p className="text-muted-foreground mb-10 leading-relaxed max-w-2xl text-sm">
        Generate custom screening plans, age-graded risk reports, and evidence-guided preventative roadmaps from our clinical database.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <form onSubmit={generateGuide} className="lg:col-span-5 bg-muted/30 p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6">
          <h3 className="font-bold text-sm text-foreground uppercase tracking-widest pb-2 border-b border-border/60">Patient Criteria</h3>
          
          <div>
            <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-2">Age</label>
            <input
              type="number"
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-medium"
              placeholder="e.g. 45"
              min="1"
              max="120"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-2">Primary Wellness Focus</label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-medium"
            >
              <option value="overall">Overall Longevity & Screening</option>
              <option value="cardio">Cardiovascular Fitness & Heart Health</option>
              <option value="strength">Muscle Density & Hormone Balance</option>
              <option value="recovery">Energy, Sleep & Recovery Optimization</option>
              <option value="mental">Cognitive Focus & Stress Resilience</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-2">Exercise / Activity State</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-medium"
            >
              <option value="sedentary">Sedentary (desk job, minimal movement)</option>
              <option value="light">Lightly Active (active walking, casual activity)</option>
              <option value="moderate">Moderately Active (structured workouts 3-5x/week)</option>
              <option value="active">Very Active (heavy weight splits / intense sports)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-2">Known Hereditary History Risks</label>
            <select
              value={familyHistory}
              onChange={(e) => setFamilyHistory(e.target.value)}
              className="w-full px-5 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm font-medium"
            >
              <option value="none">No known hereditary family history</option>
              <option value="heart">Cardiovascular disease or heart attacks</option>
              <option value="diabetes">Type 2 Diabetes / Metabolic concerns</option>
              <option value="cancer">Prostate or Colon cancer history</option>
              <option value="bloodpressure">Clinical Stroke / Arterial hypertension</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-neon-blue-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 neon-glow text-xs uppercase tracking-wider"
          >
            {loading ? 'Synthesizing Guide...' : 'Generate Health Guide'}
            <Activity className="w-4 h-4 ml-1" />
          </button>
        </form>

        {/* Live clinical checkpoints panel */}
        <div className="lg:col-span-7 bg-muted/20 p-6 sm:p-8 rounded-3xl border border-border/60">
          <h3 className="font-bold text-base text-foreground mb-1">Target Men's Health Screenings</h3>
          <p className="text-xs text-muted-foreground mb-6">Based on your entered age ({parsedAge || 'Fill form above'}), track and tick off your key age-graded clinical examinations:</p>
          
          {parsedAge <= 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm bg-muted/10 rounded-2xl border border-dashed border-border">
              Please insert your age in the form to initialize recommended diagnostic checklist trackups.
            </div>
          ) : screeningList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No critical screening thresholds triggered yet for this age range.
            </div>
          ) : (
            <div className="space-y-4">
              {screeningList.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => toggleScreening(item.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start select-none",
                    checkedScreenings[item.id]
                      ? "bg-primary/5 border-primary/20 text-foreground"
                      : "bg-background border-border hover:border-border-dark text-foreground/90"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition-all text-[10px] font-bold",
                    checkedScreenings[item.id]
                      ? "bg-primary border-primary text-white"
                      : "border-muted-foreground/50 text-transparent animate-pulse"
                  )}>
                    ✓
                  </div>
                  <div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className={cn("font-bold text-sm", checkedScreenings[item.id] ? "line-through text-muted-foreground" : "")}>
                        {item.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[9px] text-primary font-bold tracking-tight">
                        {item.frequency}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Endocrine & Longevity FAQ Accordion */}
      <div className="bg-muted/15 p-6 sm:p-8 rounded-[2rem] mt-8 border border-border/80">
        <h3 className="font-bold text-lg text-foreground mb-1 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          Preventive Longevity & Endocrine FAQ
        </h3>
        <p className="text-xs text-muted-foreground mb-6">Expert clinical guidance on hormone homeostasis, cardiac screenings, and daily resilience metrics.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              q: "What is the difference between Total and Free Testosterone?",
              a: "Total testosterone measures the total hormone content in your bloodstream. However, roughly 98% is bound to proteins (SHBG and albumin) and is biologically inactive. 'Free' testosterone represents the unbound, active fraction directly driving muscle synthesis, bone mineral density, and spatial cognitive focus. Always request a free testosterone assay for true evaluation."
            },
            {
              q: "At what age should prostate screenings (PSA) begin?",
              a: "Standard guidelines suggest discussing screening avenues starting at age 45-50. If you have immediate high-priority family history of prostate or colorectal anomalies, clinical recommendations suggest forming a personalized monitoring pathway with your general practitioner as early as age 40."
            },
            {
              q: "Which lifestyle factors have the largest impact on male hormones?",
              a: "Consistent sleep quality (7-8 hours) is the single most critical factor, as testosterone secretion peaks during deep/REM sleep cycles. Chronic high stress triggers cortisol spikes which directly downregulate the HPTA (Hypothalamic-Pituitary-Testicular Axis). Support with strength training, adequate zinc/magnesium, and healthy dietary fats."
            },
            {
              q: "How does cardiovascular vascular stiffness relate to physical integrity?",
              a: "Arterial performance is ultimately a hydraulic function. Early indicators of cardiovascular stress, endothelial weakness, or high blood pressure show up first in micro-capillaries. Maintaining rigid Zone 2 cardiovascular endurance and dynamic lipid profiles prevents passive cardiovascular stiffness."
            }
          ].map((faq, idx) => (
            <div key={idx} className="bg-card p-5 rounded-2xl border border-border">
              <span className="text-[10px] font-black tracking-widest text-primary uppercase">Topic 0{idx+1}</span>
              <h4 className="font-bold text-sm text-foreground mt-1 mb-2">{faq.q}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {guide && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-8 bg-muted/40 rounded-[2rem] border border-border/80"
        >
          <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Synthesized Guidance Report</span>
            <button 
              onClick={() => window.print()}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
            >
              Print Document
            </button>
          </div>
          <div className="prose dark:prose-invert max-w-none text-foreground/90 markdown-body leading-relaxed">
            <Markdown>{guide}</Markdown>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const WorkoutTimer = () => {
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
        setTimeLeft(45); // Rest period of 45 seconds
      } else {
        setTimerType('work');
        setTimeLeft(60); // Work set period of 60 seconds
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
        {/* Set Counter */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Set</span>
          <span className="text-2xl font-black text-foreground leading-none">{currentSet} <span className="text-sm text-muted-foreground/60">/ {totalSets}</span></span>
        </div>

        {/* Timer display */}
        <div className="flex flex-col items-center px-6 py-1 border-l border-r border-border min-w-[125px]">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-1",
            timerType === 'work' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
          )}>
            {timerType === 'work' ? "Lift Set" : "Rest Break"}
          </span>
          <span className="text-3xl font-black font-mono tracking-tighter text-foreground leading-none">{formatTime(timeLeft)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-xl",
              isRunning ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            Reset
          </button>
        </div>
      </div>
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
  const [days, setDays] = useState('4');
  const [equipment, setEquipment] = useState('gym');
  const [loading, setLoading] = useState(false);
  const [routine, setRoutine] = useState<string | null>(null);

  // Success Logging System
  const [completedWorkouts, setCompletedWorkouts] = useState<Record<string, boolean>>({});

  const toggleWorkoutDay = (dayKey: string) => {
    setCompletedWorkouts(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const generateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height || !age) return;
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: "" });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `As an elite strength and conditioning specialist and expert sports nutritionist, create an outstanding, highly tailored weekly workout planner and nutritional roadmap for a client with the following metrics:
        
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
        - **Warm-Up Protocol**: 3-5 minutes of specific dynamic mobility warm-ups to shield joints from injury.
        - **Main Workout block**: Specific compound and isolation exercises detailing exact target Sets, Reps, Intensity (RPE), and 1-sentence execution instructions.
        - **Cool-Down / Flexibility Plan**: 2-3 minutes of static stretches.
        
        ## 🥗 Nutrition & Fueling Protocols
        Tailor a calorie-conscious nutrition guide specifically for the goal: ${goal}. Detail target macronutrient distributions, optimal hydration strategies (target fluid ounces), and ideal pre- and post-workout fuel examples.
        
        ## 📈 Progression & Recovery Philosophy
        Scientific advice on progressive overload (how to build strength or stamina over weeks), required rest periods, and active recovery metrics.`,
      });
      setRoutine(response.text || "Unable to generate routine at this time.");
      // Reset tracker
      setCompletedWorkouts({});
    } catch (err) {
      console.error(err);
      setRoutine("Error connecting to fitness analysis service.");
    } finally {
      setLoading(false);
    }
  };

  const parsedDaysNum = parseInt(days, 10) || 4;

  return (
    <div>
      <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2.5">
        <Activity className="w-8 h-8 text-primary" />
        Personalized Fitness Planner
      </h2>
      <p className="text-muted-foreground mb-10 leading-relaxed max-w-2xl text-sm">
        Generate custom splits, precise exercise programs, and elite nutritional guides matched directly to your biometrics.
      </p>
      
      <form onSubmit={generateWorkout} className="space-y-6 bg-muted/20 p-6 sm:p-8 rounded-3xl border border-border/80">
        <h3 className="font-bold text-sm text-foreground uppercase tracking-widest pb-2 border-b border-border/60">1. Body Metrics & Variables</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          className="w-full py-4.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 neon-glow text-xs uppercase tracking-wider"
        >
          {loading ? 'Assembling Weekly Program...' : 'Generate Workout Routine'}
        </button>
      </form>

      {routine && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 space-y-8"
        >
          {/* Workout companion component */}
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
                        : "bg-background border-border hover:border-border-dark"
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

          {/* Core Plan text split */}
          <div className="p-8 bg-muted/20 border border-border rounded-[2.5rem] max-w-none">
            <div className="flex items-center justify-between mb-6 border-b border-border/80 pb-4 text-primary">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 animate-pulse" />
                <h3 className="text-lg font-bold m-0 neon-text">Your Personalized Weekly Program</h3>
              </div>
              <button 
                onClick={() => window.print()}
                className="text-xs font-bold hover:underline flex items-center gap-1.5"
              >
                Print Schedule
              </button>
            </div>
            <div className="markdown-body text-foreground/90 leading-relaxed prose dark:prose-invert max-w-none">
              <Markdown>{routine}</Markdown>
            </div>
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

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Calculator, 
  Stethoscope, 
  Info, 
  ChevronRight,
  ChevronLeft,
  Droplets,
  Heart,
  Baby,
  Flame,
  Moon,
  Flower,
  FileDown,
  Printer,
  TrendingUp,
  Compass,
  BookOpen,
  AlertTriangle,
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  AlignmentType,
  WidthType,
  Header,
  Footer,
  PageNumber
} from 'docx';
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
        contents: `As an expert clinical health consultant specializing in men's health, preventive care, and longevity medicine, create a comprehensive, highly personalized screening and wellness guide for a male patient. The analysis and timing protocols must align directly with guidelines published by leading health authorities (such as the US Preventive Services Task Force (USPSTF), American Cancer Society (ACS), American Heart Association (AHA), and American Urological Association (AUA)).
        
        Patient Profile:
        - Age: ${age}
        - Primary Focus Area: ${focus}
        - Physical Activity Level: ${activity}
        - Family History / Risks: ${familyHistory}
        
        Provide a detailed health screening report in high-quality Markdown. Make sure it is structured as follows:
        
        # PERSONALIZED MEN'S PREVENTIVE HEALTH REPORT
        
        ## 📋 Recommended Screenings & Preventive Timeline (Clinical Body Aligned)
        Provide a customized, chronological list of mandatory and recommended medical screenings (e.g. Prostate-Specific Antigen (PSA) test aligned with AUA/ACS guidelines, Colonoscopy aligned with USPSTF standards, Lipid Panel/Cholesterol aligned with AHA, Type 2 Diabetes screenings, etc.) based on this patient's age (${age} years) and profile risks. For each screening, clearly cite the specific recommending clinical body and state the recommended starting frequency and reasons.
        
        ## ⚠️ Key Health Risks & Vulnerabilities
        Identify specific physiological risks associated with the ${age}-year-old male bracket, factoring in the primary focus of "${focus}" and family history of "${familyHistory}". Back these risks with clinical guidance context.
        
        ## 🥗 Target Nutrition, Supplementation & Lifestyle Guidelines
        Deliver an evidence-based lifestyle roadmap. Detail custom food groups to prioritize, key essential nutrients (like CoQ10, Zinc, Omega-3s, Vitamin D3), stress-mitigation, and sleep metrics.
        
        ## 🧠 Cognitive Support & Mental Health Considerations
        Specific age-appropriate mental wellness tips focusing on managing work/life stressors, preventing burnouts, and cognitive reserve preservation.
        
        ## 🩺 Doctor Consultation Checklist
        Give the client 3-5 high-value, precise questions they can directly ask their primary care doctor during their next physical or wellness visit, based on clinical discussion recommendation pathways.
        
        ## 📚 Trusted Clinical References & Source Directory
        Provide a distinct clinical reference section explicitly framing recommendations within clinical guidelines from the US Preventive Services Task Force (USPSTF), American College of Physicians (ACP), American Cancer Society (ACS), and American Heart Association (AHA).`,
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
        <Activity className="w-8 h-8 text-primary" />
        Men's Health & Screening Guide
      </h2>
      <p className="text-muted-foreground mb-6 leading-relaxed max-w-2xl text-sm">
        Generate custom screening plans, age-graded risk reports, and evidence-guided preventative roadmaps from our clinical database.
      </p>
      
      {/* Evidence-based Medical Guidelines Background Panel */}
      <div className="bg-amber-500/10 border border-amber-500/25 p-5 rounded-3xl mb-8 flex flex-col sm:flex-row gap-4 items-start">
        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-500 shrink-0">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400 mb-1">Peer-Reviewed Preventive Frameworks</h4>
          <p className="text-xs text-amber-700/85 dark:text-slate-300 leading-relaxed mb-3 font-semibold">
            All age-graded diagnostic screenings, checkups, and cardiological warning indicators are matched against current preventive guidelines established by elite clinical academies:
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-black tracking-wider uppercase">
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-800 dark:text-amber-300">USPSTF Guidelines</span>
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-800 dark:text-amber-300">American Cancer Society (ACS)</span>
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-800 dark:text-amber-300">American Heart Assoc. (AHA)</span>
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-800 dark:text-amber-300">AUA Urology Standard</span>
          </div>
        </div>
      </div>
      
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
  const [activeTab, setActiveTab] = useState<'schedule' | 'nutrition' | 'progression' | 'full'>('schedule');

  // Success Logging System
  const [completedWorkouts, setCompletedWorkouts] = useState<Record<string, boolean>>({});

  const toggleWorkoutDay = (dayKey: string) => {
    setCompletedWorkouts(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const downloadWorkoutAsDocx = async () => {
    if (!routine) return;

    try {
      const children: any[] = [];

      // 1. Title Banner
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [
            new TextRun({
              text: "PULSEMED PERSONALIZED FITNESS & NUTRITION PLATFORM",
              bold: true,
              size: 32, // 16pt
              color: "1E3A8A", // Deep Navy Blue
              font: "Segoe UI",
            })
          ],
        })
      );

      // Subtitle with Metadata
      children.push(
        new Paragraph({
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: `Scientific Exercise Prescription & Nutrient Timing Protocol\nClient Configuration: Age ${age} • Biological Gender: ${gender.toUpperCase()} • Weight: ${weight}kg • Height: ${height}cm\nGoal: ${goal.toUpperCase().replace('-', ' ')} • Split: ${days}-Day • Environment: ${equipment.toUpperCase()}`,
              size: 18, // 9pt
              color: "64748B",
              italics: true,
              font: "Segoe UI",
            })
          ],
        })
      );

      // Horizontal separator rule
      children.push(
        new Paragraph({
          border: {
            bottom: { color: "CBD5E1", size: 12, style: BorderStyle.SINGLE, space: 1 }
          },
          spacing: { after: 400 }
        })
      );

      // Helper to parse formatting (bold **)
      const parseTextWithFormatting = (text: string, options: any = {}) => {
        const runs: TextRun[] = [];
        const regex = /\*\*(.*?)\*\*/g;
        let lastIndex = 0;
        let match;

        const defaultOptions = {
          font: "Segoe UI",
          ...options
        };

        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            runs.push(new TextRun({
              text: text.substring(lastIndex, match.index),
              ...defaultOptions
            }));
          }
          runs.push(new TextRun({
            text: match[1],
            bold: true,
            ...defaultOptions
          }));
          lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
          runs.push(new TextRun({
            text: text.substring(lastIndex),
            ...defaultOptions
          }));
        }

        if (runs.length === 0 && text.length > 0) {
          runs.push(new TextRun({ text, ...defaultOptions }));
        }

        return runs;
      };

      // Helper to build styled tables
      const buildDocxTable = (rows: string[][]) => {
        const tableRowsDocx = rows.map((rowCells, rowIndex) => {
          const isHeader = rowIndex === 0;
          const cellPadding = {
            top: 140, // dxa (7pt padding)
            bottom: 140,
            left: 180, // 9pt padding
            right: 180,
          };

          return new TableRow({
            children: rowCells.map((cellText) => {
              return new TableCell({
                children: [
                  new Paragraph({
                    children: parseTextWithFormatting(cellText, {
                      color: isHeader ? "FFFFFF" : "334155",
                      size: isHeader ? 20 : 18, // 10pt for header, 9pt for body
                      bold: isHeader,
                    }),
                    alignment: AlignmentType.LEFT,
                  })
                ],
                shading: {
                  fill: isHeader ? "1E3A8A" : (rowIndex % 2 === 0 ? "F8FAFC" : "FFFFFF"), // Navy Blue for headers, light zebra striping
                },
                margins: cellPadding,
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                },
              });
            }),
          });
        });

        return new Table({
          rows: tableRowsDocx,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          margins: {
            top: 200,
            bottom: 200,
          },
        });
      };

      // Split generated routine by lines
      const lines = routine.split('\n');
      let inTable = false;
      let tableRows: string[][] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check if empty line
        if (!line) {
          if (inTable && tableRows.length > 0) {
            children.push(buildDocxTable(tableRows));
            tableRows = [];
            inTable = false;
          }
          continue;
        }

        // Table parser checking
        const isTableLine = line.startsWith('|') && line.endsWith('|');
        if (isTableLine) {
          if (line.includes('---')) {
            continue; // separator line, ignore
          }
          const cells = line.split('|').slice(1, -1).map(c => c.trim());
          tableRows.push(cells);
          inTable = true;
          continue;
        } else {
          if (inTable && tableRows.length > 0) {
            children.push(buildDocxTable(tableRows));
            tableRows = [];
            inTable = false;
          }
        }

        // Heading levels
        if (line.startsWith('# ')) {
          const text = line.substring(2).trim();
          children.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              keepNext: true,
              children: parseTextWithFormatting(text, { color: "1E3A8A", size: 28, bold: true }) // Navy Blue, 14pt
            })
          );
        } else if (line.startsWith('## ')) {
          const text = line.substring(3).trim();
          children.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 320, after: 160 },
              keepNext: true,
              children: parseTextWithFormatting(text, { color: "0D9488", size: 24, bold: true }) // Teal, 12pt
            })
          );
        } else if (line.startsWith('### ')) {
          const text = line.substring(4).trim();
          children.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 240, after: 120 },
              keepNext: true,
              children: parseTextWithFormatting(text, { color: "475569", size: 22, bold: true }) // Slate Gray, 11pt
            })
          );
        }
        // Bullets
        else if (line.startsWith('- ') || line.startsWith('* ')) {
          const text = line.substring(2).trim();
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 100, after: 100 },
              children: parseTextWithFormatting(text, { color: "334155", size: 22 }) // 11pt
            })
          );
        }
        // Numbered list
        else if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)/);
          if (match) {
            const num = match[1];
            const text = match[2].trim();
            children.push(
              new Paragraph({
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({ text: `${num}. `, bold: true, color: "1E3A8A", size: 22, font: "Segoe UI" }),
                  ...parseTextWithFormatting(text, { color: "334155", size: 22 })
                ]
              })
            );
          }
        }
        // Standard body paragraph
        else {
          children.push(
            new Paragraph({
              spacing: { before: 120, after: 140 },
              children: parseTextWithFormatting(line, { color: "1E293B", size: 22 }) // 11pt
            })
          );
        }
      }

      // Final residual table check
      if (inTable && tableRows.length > 0) {
        children.push(buildDocxTable(tableRows));
      }

      // Create Document with headers, footers and page numbering
      const doc = new Document({
        sections: [
          {
            properties: {},
            headers: {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: "PulseMed Elite Wellness Program  |  Confidential Training Guide",
                        size: 16, // 8pt
                        color: "94A3B8",
                        font: "Segoe UI"
                      })
                    ]
                  })
                ]
              })
            },
            footers: {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: "Generated by PulseMed Clinical Analytics Engine  •  Page ",
                        size: 16, // 8pt
                        color: "94A3B8",
                        font: "Segoe UI"
                      }),
                      new TextRun({
                        children: [PageNumber.CURRENT],
                        size: 16,
                        color: "94A3B8",
                        font: "Segoe UI"
                      }),
                      new TextRun({
                        text: " of ",
                        size: 16,
                        color: "94A3B8",
                        font: "Segoe UI"
                      }),
                      new TextRun({
                        children: [PageNumber.TOTAL_PAGES],
                        size: 16,
                        color: "94A3B8",
                        font: "Segoe UI"
                      })
                    ]
                  })
                ]
              })
            },
            children: children
          }
        ]
      });

      // Export to Word Document (.docx)
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PulseMed_Fitness_Plan_${goal}_${days}Days.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (docxErr) {
      console.error("Failed to generate Word document:", docxErr);
      alert("Failed to export Word document. Please print instead.");
    }
  };

  // Parser to split markdown by Heading Level 2
  const parseSections = (markdown: string) => {
    const sectionsList: { title: string; content: string }[] = [];
    const parts = markdown.split(/^(##\s+.*)/m);
    
    // First part is any content before the first ## heading
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
    try {
      const ai = new GoogleGenAI({ apiKey: "" });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
      <p className="text-muted-foreground mb-6 leading-relaxed max-w-2xl text-sm">
        Generate custom splits, precise exercise programs, and elite nutritional guides matched directly to your biometrics.
      </p>
      
      {/* Evidence-based Sports Science Background Panel */}
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
            {/* Universal Download Panel - Highlights word export & download options */}
            <div className="bg-card border-2 border-primary/20 p-6 sm:p-8 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-md">
                  Word Document Export Ready
                </span>
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

            {/* Presentation Format Switcher Tabs */}
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

              {/* Tab Contents */}
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
  
  // 5 Form Step states
  const [step, setStep] = useState(1);
  
  // Demographics (Section 1)
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [gender, setGender] = useState(profile?.gender || 'male');
  const [pregnancyStatus, setPregnancyStatus] = useState('no');

  // Symptoms & Severity (Section 2)
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState('5');
  const [trend, setTrend] = useState('stable');

  // Timeline & Associated Symptoms (Section 3)
  const [duration, setDuration] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Health Background (Section 4)
  const [history, setHistory] = useState('');
  const [allergiesMedications, setAllergiesMedications] = useState('');

  // Triggers & Context (Section 5)
  const [triggers, setTriggers] = useState('');

  // Execution & Output states
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<{
    causes: string;
    treatments: string;
    prevention: string;
    firstaid: string;
    resources: string;
  } | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'causes' | 'treatments' | 'firstaid' | 'prevention' | 'resources'>('causes');

  const COMMON_ASSOCIATED_SYMPTOMS = [
    'Fever', 'Headache', 'Cough', 'Shortness of breath', 
    'Nausea / Vomiting', 'Fatigue / Weakness', 'Dizziness', 
    'Muscle/Body aches', 'Sore throat', 'Chills / Shivering', 
    'Diarrhea', 'Loss of taste/smell', 'Rash / Skin irritation'
  ];

  const handleSymptomToggle = (symptomName: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomName) 
        ? prev.filter(s => s !== symptomName) 
        : [...prev, symptomName]
    );
  };

  const parseAnalysis = (text: string) => {
    const sections = {
      causes: '',
      treatments: '',
      prevention: '',
      firstaid: '',
      resources: '',
    };

    const keys = {
      causes: '[SECTION_1: POTENTIAL_CAUSES]',
      treatments: '[SECTION_2: TREATMENT_PATHWAYS]',
      prevention: '[SECTION_3: PREVENTION_STRATEGIES]',
      firstaid: '[SECTION_4: FIRST_AID_PROTOCOLS]',
      resources: '[SECTION_5: CLINICAL_RESOURCES]',
    };

    let currentKey: keyof typeof sections | null = null;
    const lines = text.split('\n');

    for (const line of lines) {
      let matched = false;
      for (const [key, tag] of Object.entries(keys)) {
        if (line.includes(tag)) {
          currentKey = key as keyof typeof sections;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      if (currentKey) {
        sections[currentKey] += line + '\n';
      } else {
        sections.causes += line + '\n';
      }
    }

    // Check if the keys actually partitioned the text
    if (!sections.treatments && !sections.prevention && !sections.firstaid && !sections.resources) {
      return null; // Fallback to raw rendering
    }

    return sections;
  };

  const checkSymptoms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    
    setLoading(true);
    setAnalysis(null);
    setParsedResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: "" });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `As an advanced, clinically-grounded medical symptom checker assistant, analyze the following patient details. All potential insights and timelines must be meticulously cross-referenced against world-class clinical databases (including Mayo Clinic, National Institutes of Health (NIH) databases, Centers for Disease Control and Prevention (CDC) clinical guidance, and NHS standard guidelines) to ensure the safe, highly structured, and educational nature of the generated information.

Patient Configuration Details:
- Age: ${age || 'Unspecified'}
- Biological Gender: ${gender}
- Pregnancy Status: ${gender === 'female' || gender === 'other' ? pregnancyStatus : 'N/A'}
- Primary Symptoms: ${symptoms}
- Severity (1-10): ${severity}
- Progression Trend: ${trend}
- Symptom Duration: ${duration || 'Unspecified'}
- Associated Symptoms: ${selectedSymptoms.join(', ') || 'None selected'}
- Pre-existing Conditions: ${history || 'None reported'}
- Allergies & Active Medications: ${allergiesMedications || 'None reported'}
- Environmental Context / Triggers: ${triggers || 'None reported'}

You MUST structure your response into exactly 5 distinct sections, each preceded by its corresponding section tag EXACTLY as shown below:

[SECTION_1: POTENTIAL_CAUSES]
## Possible Causes & Pathology
- Provide a rigorous, educational breakdown of potential health conditions (explicitly state that these are educational possibilities, NOT a formal medical diagnosis).
- Detail clinical practice pathways (e.g., "per Mayo Clinic diagnostic guidelines...").

[SECTION_2: TREATMENT_PATHWAYS]
## Evidence-Based Treatment Pathways
- Detail typical therapies, over-the-counter or prescription protocols commonly used conforming to clinical standards, and home care practices.
- Highlight when a treatment must only be done under professional supervision.

[SECTION_3: PREVENTION_STRATEGIES]
## Preventive Care & Lifestyle Adjustments
- Outline evidence-backed prevention guidelines (hygiene, vaccines, specific dietary restrictions, sleep alterations, etc.).
- Detail physical or lifestyle adjustments to prevent recurrence.

[SECTION_4: FIRST_AID_PROTOCOLS]
## First Aid & Critical Warning Red Flags
- Detail clear immediate physical first aid actions if appropriate.
- Outline critical red-flag emergency symptoms/warning signs (e.g., chest pain, difficulty breathing, sudden numbness) that require immediate urgent/emergency clinical assistance.

[SECTION_5: CLINICAL_RESOURCES]
## Doctor Screening Checkpoints & Verified Sources
- Provide 3-5 high-value, precise questions the patient should directly ask their consulting primary care provider.
- Provide a verified educational directory table referencing trustworthy medical platforms (such as MayoClinic.org, CDC.gov, MedlinePlus) with specific search terms.

Be professional, direct, supportive, and clear. Avoid fluff. Do not use conversational preambles or postambles outside of the sections.`,
      });

      const responseText = response.text || "Unable to analyze symptoms at this time.";
      setAnalysis(responseText);
      const parsed = parseAnalysis(responseText);
      setParsedResult(parsed);
      setActiveResultTab('causes');
    } catch (err) {
      console.error(err);
      setAnalysis("Error connecting to health analysis service.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 2 && !symptoms.trim()) {
      alert("Please describe your primary symptoms before proceeding.");
      return;
    }
    if (step === 3 && !duration.trim()) {
      alert("Please provide the symptom duration.");
      return;
    }
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Stepper UI info
  const stepLabels = [
    { title: "Profile", desc: "Age & Gender" },
    { title: "Symptoms", desc: "Main issues" },
    { title: "Timeline", desc: "Duration & more" },
    { title: "Background", desc: "Medical History" },
    { title: "Triggers", desc: "Context" }
  ];

  return (
    <div id="advanced-symptom-checker" className="space-y-6">
      <h2 id="symptom-checker-title" className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">Advanced Symptom Checker</h2>
      <p id="symptom-checker-subtitle" className="text-slate-500 dark:text-slate-400 mb-6">Complete the five diagnostic sections to receive a comprehensive clinically-grounded report.</p>
      
      {/* Evidence-based Clinical Grounding Panel */}
      <div id="grounding-panel" className="bg-emerald-500/10 border border-emerald-500/25 p-5 rounded-3xl mb-8 flex flex-col sm:flex-row gap-4 items-start">
        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-400 mb-1">Evidence-Based Clinical Grounding</h4>
          <p className="text-xs text-emerald-700/85 dark:text-slate-300 leading-relaxed mb-3">
            To generate safe, patient-centered insights, medical calculations, and diagnostic guidance, PulsePoint triggers search processes grounded in clinical guidelines, peer-reviewed databases, and professional institutions:
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-black tracking-wider uppercase">
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-800 dark:text-emerald-300">Mayo Clinic Guidelines</span>
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-800 dark:text-emerald-300">NIH MedlinePlus Database</span>
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-800 dark:text-emerald-300">CDC Health Standard Alerts</span>
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-800 dark:text-emerald-300">NHS Clinical Pathways</span>
          </div>
        </div>
      </div>

      {/* 5-Step Interactive Form */}
      <div id="stepper-card" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        
        {/* Stepper Header */}
        <div id="stepper-progress" className="mb-10">
          <div className="flex justify-between items-center relative">
            {stepLabels.map((sl, index) => {
              const num = index + 1;
              const isCompleted = step > num;
              const isActive = step === num;
              return (
                <div key={index} className="flex flex-col items-center flex-1 relative z-10">
                  <button 
                    type="button"
                    onClick={() => {
                      // Allow jumping backward or to next adjacent step if validated
                      if (num < step) setStep(num);
                      else if (num === step + 1) handleNext();
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2",
                      isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                      isActive && "bg-neon-blue border-neon-blue text-slate-900 shadow-md shadow-neon-blue/25 scale-110",
                      !isActive && !isCompleted && "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : num}
                  </button>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider mt-2 text-center hidden md:block",
                    isActive ? "text-neon-blue" : "text-slate-400"
                  )}>
                    {sl.title}
                  </span>
                  <span className="text-[9px] text-slate-400/80 mt-0.5 text-center hidden lg:block">
                    {sl.desc}
                  </span>
                </div>
              );
            })}
            
            {/* Stepper connector line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-neon-blue transition-all duration-500 -z-10" 
              style={{ width: `${((Math.max(1, step) - 1) / (stepLabels.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Dynamic Form Sections */}
        <form onSubmit={checkSymptoms} className="space-y-6">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: DEMOGRAPHICS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-[rgb(var(--foreground))]">Section 1: Demographics & Profile</h3>
                  <p className="text-xs text-slate-400">Basic demographic indicators help tailor age-and-gender-related clinical diagnostic rules.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
                      placeholder="Enter age (e.g. 32)"
                      min="0"
                      max="125"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Biological Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {(gender === 'female' || gender === 'other') && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-purple-500/5 border border-purple-500/10 rounded-2xl"
                  >
                    <label className="block text-sm font-semibold text-purple-400 mb-2">Pregnancy Status</label>
                    <div className="flex gap-4">
                      {['yes', 'no', 'unspecified'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setPregnancyStatus(status)}
                          className={cn(
                            "px-5 py-2.5 rounded-xl font-semibold text-xs capitalize transition-all border",
                            pregnancyStatus === status 
                              ? "bg-purple-500/15 border-purple-500 text-purple-400" 
                              : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-300"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 2: PRIMARY SYMPTOMS & TREND */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-[rgb(var(--foreground))]">Section 2: Primary Symptoms & Trend</h3>
                  <p className="text-xs text-slate-400">Describe what you are currently feeling and the trend of these feelings.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Describe Your Primary Symptoms <span className="text-red-500">*</span></label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all min-h-[120px] resize-none text-[rgb(var(--foreground))]"
                    placeholder="e.g., Throbbing localized pain on the right side of my head, accompanied by visual flickering, and sensitivity to bright lights..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Symptom Intensity / Severity (1-10)</label>
                    <div className="flex items-center gap-4 px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        className="flex-grow h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                      />
                      <span className="font-bold text-neon-blue text-lg w-6 text-center">{severity}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Symptom Trend over Time</label>
                    <select
                      value={trend}
                      onChange={(e) => setTrend(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
                    >
                      <option value="stable">Stable / Consistent</option>
                      <option value="increasing">Worsening / Increasing</option>
                      <option value="decreasing">Improving / Decreasing</option>
                      <option value="fluctuating">Fluctuating / Intermittent</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: TIMELINE & ASSOCIATED SYMPTOMS */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-[rgb(var(--foreground))]">Section 3: Timeline & Associated Symptoms</h3>
                  <p className="text-xs text-slate-400">Identify how long you've been sick and any secondary markers.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">How long have you had these symptoms? <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
                    placeholder="e.g., 3 days, 1 week, since this morning"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Do you have any of these associated symptoms? (Select all that apply)</label>
                  <div className="flex flex-wrap gap-2.5">
                    {COMMON_ASSOCIATED_SYMPTOMS.map((symptom) => {
                      const isSelected = selectedSymptoms.includes(symptom);
                      return (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => handleSymptomToggle(symptom)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-semibold transition-all border duration-200",
                            isSelected 
                              ? "bg-neon-blue/15 border-neon-blue text-neon-blue shadow-sm" 
                              : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          {symptom}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: HEALTH BACKGROUND */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-[rgb(var(--foreground))]">Section 4: Medical History & Background</h3>
                  <p className="text-xs text-slate-400">Underlying medical history or chronic conditions can severely impact triage assessments.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Pre-existing Medical Conditions / History (Optional)</label>
                  <textarea
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all min-h-[90px] resize-none text-[rgb(var(--foreground))]"
                    placeholder="e.g. Hypertension, asthma, diabetes, heart condition, none..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Known Allergies & Active Medications (Optional)</label>
                  <textarea
                    value={allergiesMedications}
                    onChange={(e) => setAllergiesMedications(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all min-h-[90px] resize-none text-[rgb(var(--foreground))]"
                    placeholder="e.g. Allergic to penicillin. Currently taking 10mg Lisinopril daily..."
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 5: TRIGGERS & CONTEXT */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-[rgb(var(--foreground))]">Section 5: Triggers, Exposures & Environmental Context</h3>
                  <p className="text-xs text-slate-400">Environmental context can highlight toxic, viral, bacterial, or traumatic triggers.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recent Travel, Injuries, Sick Contacts, or Stressors (Optional)</label>
                  <textarea
                    value={triggers}
                    onChange={(e) => setTriggers(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all min-h-[140px] resize-none text-[rgb(var(--foreground))]"
                    placeholder="e.g., Traveled to Costa Rica 10 days ago, was recently bitten by a tick, or exposed to a child with chickenpox..."
                  />
                </div>

                <div className="p-4 bg-amber-500/15 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-2xl flex gap-3 text-xs leading-relaxed">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                  <p>
                    <strong>Educational Guidance:</strong> This digital symptom evaluation is driven by clinical databases but does not constitute, replace, or override a professional in-person medical diagnosis. If you are experiencing serious, acute symptoms, please seek emergency medical attention.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Stepper Navigation Buttons */}
          <div id="form-nav-buttons" className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={cn(
                "px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all",
                step === 1 
                  ? "opacity-40 cursor-not-allowed border-transparent text-slate-400" 
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !symptoms.trim()}
                className="px-8 py-3 bg-neon-blue text-slate-900 rounded-xl font-extrabold text-xs tracking-wider uppercase hover:bg-neon-blue-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed neon-glow flex items-center gap-2"
              >
                {loading ? 'Analyzing Data...' : 'Submit Assessment Report'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <motion.div 
          id="symptom-analysis-results"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm"
        >
          <div className="flex items-center gap-2.5 mb-6 text-neon-blue border-b border-slate-100 dark:border-slate-800 pb-4">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-xl font-bold text-[rgb(var(--foreground))]">Clinical Triage & Symptom Breakdown</h3>
          </div>

          {parsedResult ? (
            <div id="tabbed-results" className="space-y-6">
              
              {/* Tab Selector Menu */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                {[
                  { id: 'causes', label: 'Potential Causes', icon: Stethoscope, color: 'text-blue-500' },
                  { id: 'treatments', label: 'Treatments', icon: Heart, color: 'text-rose-500' },
                  { id: 'firstaid', label: 'First Aid & Warnings', icon: AlertTriangle, color: 'text-amber-500' },
                  { id: 'prevention', label: 'Prevention', icon: Shield, color: 'text-emerald-500' },
                  { id: 'resources', label: 'Doctor Questions & Sources', icon: Info, color: 'text-indigo-500' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeResultTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveResultTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all border duration-150",
                        isActive 
                          ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-neon-blue shadow-sm" 
                          : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", tab.color)} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Display Area */}
              <div className="p-2 sm:p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl min-h-[250px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeResultTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="markdown-body text-slate-700 dark:text-slate-300 leading-relaxed max-w-none"
                  >
                    {activeResultTab === 'causes' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-500 text-sm font-bold bg-blue-500/10 w-fit px-3.5 py-1.5 rounded-full mb-2">
                          <Stethoscope className="w-4 h-4" /> Potential Pathologies
                        </div>
                        <Markdown>{parsedResult.causes}</Markdown>
                      </div>
                    )}
                    {activeResultTab === 'treatments' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-rose-500 text-sm font-bold bg-rose-500/10 w-fit px-3.5 py-1.5 rounded-full mb-2">
                          <Heart className="w-4 h-4" /> Clinical Treatments
                        </div>
                        <Markdown>{parsedResult.treatments}</Markdown>
                      </div>
                    )}
                    {activeResultTab === 'firstaid' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-500 text-sm font-bold bg-amber-500/10 w-fit px-3.5 py-1.5 rounded-full mb-2">
                          <AlertTriangle className="w-4 h-4" /> Immediate Care & Red Flags
                        </div>
                        <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl mb-4 text-xs text-red-400 leading-relaxed font-semibold">
                          Please evaluate these warning metrics immediately. If your condition qualifies as acute or emergency, contact emergency service departments at once.
                        </div>
                        <Markdown>{parsedResult.firstaid}</Markdown>
                      </div>
                    )}
                    {activeResultTab === 'prevention' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold bg-emerald-500/10 w-fit px-3.5 py-1.5 rounded-full mb-2">
                          <Shield className="w-4 h-4" /> Preventive Care Protocols
                        </div>
                        <Markdown>{parsedResult.prevention}</Markdown>
                      </div>
                    )}
                    {activeResultTab === 'resources' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-500 text-sm font-bold bg-indigo-500/10 w-fit px-3.5 py-1.5 rounded-full mb-2">
                          <Info className="w-4 h-4" /> Provider Consult & Verified Databases
                        </div>
                        <Markdown>{parsedResult.resources}</Markdown>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          ) : (
            /* Fallback for raw rendering */
            <div className="markdown-body text-slate-700 dark:text-slate-300 leading-relaxed">
              <Markdown>{analysis}</Markdown>
            </div>
          )}
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

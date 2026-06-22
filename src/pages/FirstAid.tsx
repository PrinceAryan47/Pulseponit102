import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  Search, 
  Phone, 
  CheckSquare, 
  Info, 
  ChevronRight,
  Heart,
  Wind,
  Droplets,
  Flame,
  AlertTriangle,
  Zap,
  User,
  Clock,
  ExternalLink,
  PlusCircle,
  Stethoscope,
  RotateCcw,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "../services/aiService";
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import GuestOverlay from '../components/GuestOverlay';
import { useSearchParams } from 'react-router-dom';

// Visual Animation Component for CPR
const CPRAnimation = () => (
  <div className="relative w-full h-64 bg-muted rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 border-destructive/20 shadow-inner">
    <motion.div 
      className="absolute inset-0 bg-destructive/5"
      animate={{ opacity: [0, 0.1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity }}
    />
    <div className="relative flex flex-col items-center">
      {/* Human Figure (Lying Down) */}
      <div className="relative w-56 h-28 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center">
        {/* Head */}
        <div className="absolute -left-12 w-14 h-14 bg-slate-300 dark:bg-slate-700 rounded-full border-b-4 border-slate-400/30" />
        {/* Chest Area */}
        <motion.div 
          className="w-24 h-24 bg-slate-400 dark:bg-slate-600 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 0.85, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className="w-16 h-16 bg-destructive/10 rounded-full border-2 border-destructive/20" />
        </motion.div>
      </div>
      
      {/* Rescuer Hands */}
      <motion.div
        className="absolute top-0 z-10"
        animate={{ y: [-30, 40, -30] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center">
          <div className="w-14 h-20 bg-primary rounded-full border-4 border-background shadow-2xl flex items-center justify-center">
            <div className="w-1 h-10 bg-primary-foreground/30 rounded-full" />
          </div>
          <div className="w-20 h-10 bg-primary/80 rounded-full -mt-6 border-2 border-primary-foreground/20" />
        </div>
      </motion.div>
    </div>
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-background/80 backdrop-blur-md px-6 py-2 rounded-full border border-destructive/20 shadow-lg">
      <div className="w-2 h-2 bg-destructive rounded-full animate-ping" />
      <span className="text-[10px] font-black text-destructive uppercase tracking-[0.2em]">100-120 BPM</span>
    </div>
  </div>
);

// Visual Animation for Choking (Heimlich)
const ChokingAnimation = () => (
  <div className="relative w-full h-64 bg-muted rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 border-blue-500/20 shadow-inner">
    <div className="relative flex items-center">
      {/* Victim */}
      <div className="relative">
        <div className="w-16 h-16 bg-slate-300 dark:bg-slate-700 rounded-full mb-2" /> {/* Head */}
        <div className="w-24 h-40 bg-slate-300 dark:bg-slate-700 rounded-t-3xl" /> {/* Body */}
      </div>
      
      {/* Rescuer (Behind) */}
      <div className="absolute -right-4 top-10">
        <div className="w-14 h-14 bg-slate-400 dark:bg-slate-600 rounded-full mb-2 opacity-50" />
        <div className="w-20 h-32 bg-slate-400 dark:bg-slate-600 rounded-t-3xl opacity-50" />
      </div>

      {/* Thrusting Arms */}
      <motion.div
        className="absolute right-0 top-32 z-10"
        animate={{ x: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "anticipate" }}
      >
        <div className="flex items-center">
          <div className="w-24 h-10 bg-primary rounded-full border-4 border-background shadow-2xl flex items-center justify-end pr-2">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-full" />
          </div>
        </div>
      </motion.div>
    </div>
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-blue-500/20">
      <Wind className="w-4 h-4 text-blue-500" />
      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Inward & Upward</span>
    </div>
  </div>
);

// Visual Animation for Bleeding
const BleedingAnimation = () => (
  <div className="relative w-full h-64 bg-muted rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 border-rose-500/20 shadow-inner">
    <div className="relative flex flex-col items-center">
      {/* Arm */}
      <div className="w-48 h-16 bg-slate-300 dark:bg-slate-700 rounded-full relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-6 bg-rose-500 blur-md animate-pulse" />
      </div>
      
      {/* Hand with Bandage */}
      <motion.div
        className="absolute -top-12"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center">
          <div className="w-24 h-20 bg-background rounded-2xl border-4 border-rose-500 shadow-2xl flex items-center justify-center">
            <div className="w-16 h-1 bg-rose-100 dark:bg-rose-900/30 rounded-full mb-1" />
            <div className="w-16 h-1 bg-rose-100 dark:bg-rose-900/30 rounded-full" />
          </div>
          <div className="w-12 h-16 bg-slate-400 dark:bg-slate-600 rounded-full -mt-4 border-2 border-background/20" />
        </div>
      </motion.div>
    </div>
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-rose-500/20">
      <Droplets className="w-4 h-4 text-rose-500" />
      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Constant Pressure</span>
    </div>
  </div>
);

// Visual Animation for Burns
const BurnsAnimation = () => (
  <div className="relative w-full h-64 bg-muted rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 border-orange-500/20 shadow-inner">
    <div className="relative flex flex-col items-center">
      {/* Hand */}
      <div className="w-32 h-40 bg-orange-100 dark:bg-orange-900/20 rounded-t-full relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-500/20 blur-xl animate-pulse" />
      </div>
      
      {/* Running Water */}
      <div className="absolute -top-10 flex flex-col items-center">
        <motion.div
          animate={{ height: [0, 120, 120], opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-6 bg-blue-400/30 rounded-full"
        />
        <motion.div
          animate={{ y: [0, 100], opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <Droplets className="w-8 h-8 text-blue-500" />
        </motion.div>
      </div>
    </div>
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-orange-500/20">
      <Flame className="w-4 h-4 text-orange-500" />
      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Cool for 20 Mins</span>
    </div>
  </div>
);

// Visual Animation for Stroke
const StrokeAnimation = () => (
  <div className="relative w-full h-48 bg-muted rounded-3xl flex items-center justify-center overflow-hidden border-4 border-purple-500/20">
    <div className="relative flex items-center gap-8">
      <div className="relative">
        <User className="w-24 h-24 text-slate-400" />
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-8 right-6 w-4 h-6 bg-purple-500/40 rounded-full blur-sm"
        />
      </div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <Clock className="w-16 h-16 text-purple-500" />
      </motion.div>
    </div>
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
      <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Act F.A.S.T.</span>
    </div>
  </div>
);

// Visual Animation for Poisoning
const PoisoningAnimation = () => (
  <div className="relative w-full h-48 bg-muted rounded-3xl flex items-center justify-center overflow-hidden border-4 border-amber-500/20">
    <div className="relative flex items-center gap-6">
      <div className="w-16 h-24 bg-slate-300 dark:bg-slate-700 rounded-lg relative flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-slate-400 dark:bg-slate-600 rounded-t-md" />
      </div>
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Phone className="w-16 h-16 text-amber-500" />
      </motion.div>
    </div>
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Call Poison Control</span>
    </div>
  </div>
);

const COMMON_EMERGENCIES = [
  { id: 'heart_attack', name: 'Heart Attack / Cardiac Arrest', query: 'Heart Attack (Chest Pain / Cardiac Arrest)' },
  { id: 'stroke', name: 'Stroke / Face Droop', query: 'Stroke (B.E. F.A.S.T.)' },
  { id: 'anaphylaxis', name: 'Anaphylaxis / Allergic Reaction', query: 'Anaphylaxis (Severe Allergic Reaction)' },
  { id: 'asthma', name: 'Asthma Attack / Breathing Difficulty', query: 'Severe Asthma Attack / Breathing Difficulty' },
  { id: 'choking', name: 'Choking / Blocked Airway', query: 'Choking (Heimlich Maneuver)' },
  { id: 'bleeding', name: 'Heavy Bleeding / Hemorrhage', query: 'Severe Bleeding and Wound Management' },
  { id: 'burns', name: 'Severe Burns / Scalding', query: 'Severe Burns (1st, 2nd, and 3rd Degree)' },
  { id: 'heat_stroke', name: 'Heat Stroke / Heat Prostration', query: 'Heat Stroke / Severe Heat Exhaustion' },
  { id: 'seizure', name: 'Seizures / Epilepsy', query: 'Seizure or Convulsions First Aid' },
  { id: 'poisoning', name: 'Poisoning / Toxins', query: 'Poisoning / Toxic Ingestion First Aid' },
  { id: 'fracture', name: 'Fracture / Broken Bone', query: 'Bone Fracture or Dislocation First Aid' },
  { id: 'snake_bite', name: 'Snake or Insect Bite', query: 'Venomous Snake Bite or Sting First Aid' },
  { id: 'concussion', name: 'Concussion / Head Injury', query: 'Head Injury, Concussion, or Trauma First Aid' },
  { id: 'electric_shock', name: 'Electric Shock', query: 'Electric Shock or High Voltage Exposure First Aid' },
];

const FirstAid: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(() => {
    return searchParams.get('guide') || null;
  });
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const { user } = useAuth();

  // Smart Search States
  const [smartSearchQuery, setSmartSearchQuery] = useState('');
  const [smartAiInstructions, setSmartAiInstructions] = useState<string | null>(null);
  const [isSmartAiLoading, setIsSmartAiLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const guideParam = searchParams.get('guide');
    if (guideParam) {
      setSelectedGuide(guideParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSuggestions(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const triggerSmartFirstAidAi = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSmartAiLoading(true);
    setSmartAiInstructions(null);
    setSmartSearchQuery(queryText);
    
    // Auto sync/focus matching visual guide if applicable
    const lowerQuery = queryText.toLowerCase();
    if (lowerQuery.includes('cpr') || lowerQuery.includes('cardiac') || lowerQuery.includes('heart attack')) {
      setSelectedGuide('cpr');
    } else if (lowerQuery.includes('chok')) {
      setSelectedGuide('choking');
    } else if (lowerQuery.includes('bleed') || lowerQuery.includes('wound') || lowerQuery.includes('hemorrhage')) {
      setSelectedGuide('bleeding');
    } else if (lowerQuery.includes('burn') || lowerQuery.includes('scalding')) {
      setSelectedGuide('burns');
    } else if (lowerQuery.includes('stroke') || lowerQuery.includes('fast')) {
      setSelectedGuide('stroke');
    } else if (lowerQuery.includes('poison')) {
      setSelectedGuide('poisoning');
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an expert emergency medical consultant. Provide high-priority, bullet-pointed, step-by-step first aid instructions for a life-threatening or urgent crisis query of: "${queryText}".

Format your response using Markdown:
- Start with a clear level-3 heading "## IMMEDIATE ACTIONS" followed by 3-5 bold numbered steps.
- Provide a brief "⚠️ CRITICAL WARNINGS / WHAT NOT TO DO" section.
- Conclude with a clear reminder of when/how to contact emergency responders (911 / 112).
- Ensure the tone is direct, calm, and lacks any technical jargon, tailored for someone in high panic.`,
      });
      const responseText = response.text || "Unable to generate custom instructions at this time. Please call 911 immediately.";
      setSmartAiInstructions(responseText);
      if (isAudioEnabled) {
        speakInstructions(responseText);
      }
    } catch (err) {
      console.error(err);
      setSmartAiInstructions("Error connecting to Gemini Emergency Service. Call 911 immediately.\n\n### Essential Standard Advice\n1. Check scene safety.\n2. Tap and shout to check responsiveness.\n3. Keep airway open.\n4. Apply direct pressure to heavy wounds.");
    } finally {
      setIsSmartAiLoading(false);
    }
  };

  const enableAudio = () => {
    if ('speechSynthesis' in window) {
      setIsAudioEnabled(true);
      speakInstructions("Audio assistance enabled. You can now listen to first aid steps and AI responses.");
    } else {
      alert("Speech synthesis is not supported in your browser.");
    }
  };

  const emergencyGuides = [
    {
      id: 'cpr',
      title: 'CPR (Adult)',
      icon: Heart,
      color: 'text-red-500 bg-red-500/10',
      animation: <CPRAnimation />,
      steps: [
        'Check the scene for safety.',
        'Check for responsiveness. Tap and shout.',
        'Call 911 or local emergency services immediately.',
        'Place the heel of one hand in the center of the chest.',
        'Push hard and fast (100-120 compressions per minute).',
        'Allow the chest to recoil completely between compressions.',
        'Continue until professional help arrives or an AED is ready.'
      ]
    },
    {
      id: 'choking',
      title: 'Choking',
      icon: Wind,
      color: 'text-blue-500 bg-blue-500/10',
      animation: <ChokingAnimation />,
      steps: [
        'Ask "Are you choking?" If they can speak, encourage coughing.',
        'If they cannot speak, stand behind them.',
        'Give 5 back blows between the shoulder blades with the heel of your hand.',
        'Give 5 abdominal thrusts (Heimlich maneuver).',
        'Repeat 5-and-5 until the object is forced out or the person becomes unconscious.',
        'If unconscious, start CPR.'
      ]
    },
    {
      id: 'bleeding',
      title: 'Severe Bleeding',
      icon: Droplets,
      color: 'text-rose-600 bg-rose-600/10',
      animation: <BleedingAnimation />,
      steps: [
        'Apply direct pressure to the wound with a clean cloth or bandage.',
        'Do not remove the cloth if it becomes soaked; add more on top.',
        'If bleeding is life-threatening and on a limb, use a tourniquet if trained.',
        'Keep the person calm and lying down.',
        'Call emergency services if bleeding is heavy or won\'t stop.'
      ]
    },
    {
      id: 'burns',
      title: 'Burns',
      icon: Flame,
      color: 'text-orange-500 bg-orange-500/10',
      animation: <BurnsAnimation />,
      steps: [
        'Stop the burning process (remove from heat source).',
        'Cool the burn with cool (not cold) running water for at least 10-20 minutes.',
        'Remove jewelry or tight clothing before swelling starts.',
        'Cover the burn loosely with a sterile dressing or clean plastic wrap.',
        'Do not apply ice, butter, or ointments to severe burns.',
        'Seek medical help for large, deep, or chemical burns.'
      ]
    },
    {
      id: 'stroke',
      title: 'Stroke (B.E. F.A.S.T.)',
      icon: Zap,
      color: 'text-purple-500 bg-purple-500/10',
      animation: <StrokeAnimation />,
      steps: [
        'Balance: Sudden loss of balance or coordination?',
        'Eyes: Sudden vision changes or loss?',
        'Face: Does one side of the face droop when smiling?',
        'Arms: Does one arm drift downward when both are raised?',
        'Speech: Is speech slurred or strange?',
        'Time: Call 911 immediately if any of these signs are present.'
      ]
    },
    {
      id: 'poisoning',
      title: 'Poisoning',
      icon: AlertTriangle,
      color: 'text-amber-500 bg-amber-500/10',
      animation: <PoisoningAnimation />,
      steps: [
        'Try to identify the substance and amount taken.',
        'Call Poison Control immediately (1-800-222-1222 in US).',
        'Do not induce vomiting unless told to do so by a professional.',
        'If the person is unconscious, call 911 and start CPR if needed.',
        'If the substance is on the skin or in the eyes, flush with water for 15 minutes.'
      ]
    }
  ];

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are a professional emergency first aid assistant. Provide immediate, step-by-step first aid instructions for the following situation: "${aiQuery}". 
        
        Rules:
        1. Be concise and clear.
        2. Prioritize life-saving actions.
        3. Always remind the user to call emergency services (911/112) if the situation is serious.
        4. Use Markdown formatting with bold text for emphasis.
        5. If the query is not related to first aid, politely decline and ask for a first aid related question.`,
      });
      setAiResponse(response.text || "Unable to provide instructions at this time.");
    } catch (err) {
      console.error(err);
      setAiResponse("Error connecting to emergency analysis service. Please call 911 if this is a life-threatening emergency.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClearChat = () => {
    setAiQuery('');
    setAiResponse(null);
  };

  const speakInstructions = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis is not supported in your browser.");
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const filteredGuides = emergencyGuides.filter(guide => 
    guide.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      <GuestOverlay 
        title="Sign in for Advanced Emergency Tools"
        description="PulsePoint members get access to our AI Emergency Assistant and high-detail visual guides."
      >
        {/* Emergency Header */}
        <div className="mb-12 bg-destructive rounded-[3rem] p-10 text-destructive-foreground shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-background text-destructive rounded-3xl shadow-xl">
                  <LifeBuoy className="w-10 h-10" />
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Emergency <br /> Help Center</h1>
              </div>
              <p className="text-2xl font-medium text-destructive-foreground/90 leading-tight mb-8">
                Stay calm. Follow the pictures. Call for help immediately.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="tel:911"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-background text-destructive rounded-2xl font-black uppercase tracking-tighter hover:bg-muted transition-all shadow-xl"
                >
                  <Phone className="w-6 h-6" />
                  Call 911 Now
                </a>
                <button 
                  onClick={() => setSelectedGuide('cpr')}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-destructive-foreground/10 text-destructive-foreground rounded-2xl font-black uppercase tracking-tighter hover:bg-destructive-foreground/20 transition-all border border-destructive-foreground/20"
                >
                  <Heart className="w-6 h-6" />
                  Start CPR Guide
                </button>
                {!isAudioEnabled && (
                  <button 
                    onClick={enableAudio}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-tighter hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
                  >
                    <Volume2 className="w-6 h-6" />
                    Enable Audio Help
                  </button>
                )}
              </div>
            </div>
            <div className="hidden lg:block">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border-4 border-white/30"
              >
                <Heart className="w-24 h-24 text-white fill-white" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Dynamic Search & AI Guidance Center */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="mb-12 bg-card rounded-[3rem] p-8 md:p-10 border-4 border-destructive/10 shadow-2xl relative overflow-hidden transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-destructive/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
                  <LifeBuoy className="w-8 h-8 text-destructive animate-pulse" />
                  Instant Emergency AI Search
                </h2>
                <p className="text-muted-foreground font-medium text-lg mt-1">
                  Type any injury or emergency (e.g. "heat stroke", "dog bite") for immediate AI-generated triage and instructions.
                </p>
              </div>
              {smartAiInstructions && (
                <button
                  onClick={() => {
                    setSmartSearchQuery('');
                    setSmartAiInstructions(null);
                  }}
                  className="self-start md:self-auto px-6 py-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-2xl font-bold transition-all flex items-center gap-2 border border-border"
                >
                  <RotateCcw className="w-5 h-5" />
                  Clear Search
                </button>
              )}
            </div>

            {/* Smart Search Input & Suggestions */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                <input
                  type="text"
                  value={smartSearchQuery}
                  onFocus={(e) => {
                    e.stopPropagation();
                    setShowSuggestions(true);
                  }}
                  onChange={(e) => {
                    setSmartSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      triggerSmartFirstAidAi(smartSearchQuery);
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder="What is the medical emergency? (e.g., snake bite, chest pain, seizure...)"
                  className="w-full pl-16 pr-44 py-6 bg-muted/60 border-2 border-border rounded-[2rem] focus:ring-4 focus:ring-destructive/20 outline-none transition-all text-lg md:text-xl font-bold text-foreground placeholder:text-muted-foreground/30"
                />
                <button
                  onClick={() => {
                    triggerSmartFirstAidAi(smartSearchQuery);
                    setShowSuggestions(false);
                  }}
                  disabled={isSmartAiLoading || !smartSearchQuery.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-4 bg-destructive text-white rounded-[1.5rem] font-bold uppercase tracking-wider hover:bg-destructive/90 transition-all flex items-center gap-2 shadow-lg shadow-destructive/20 text-sm disabled:opacity-45"
                >
                  {isSmartAiLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      Ask AI
                    </>
                  )}
                </button>
              </div>

              {/* Suggestions Panel */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-30 left-0 right-0 mt-3 p-4 bg-popover border-2 border-border rounded-[2.5rem] shadow-2xl max-h-80 overflow-y-auto"
                  >
                    <div className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border mb-3">
                      Common Emergency Situations
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {COMMON_EMERGENCIES.filter(item => 
                        item.name.toLowerCase().includes(smartSearchQuery.toLowerCase())
                      ).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSmartSearchQuery(item.name);
                            triggerSmartFirstAidAi(item.query);
                            setShowSuggestions(false);
                          }}
                          className="flex items-center justify-between p-4 bg-muted/30 hover:bg-destructive/10 text-foreground hover:text-destructive rounded-2xl transition-all text-left font-bold"
                        >
                          <span className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                            {item.name}
                          </span>
                          <ChevronRight className="w-5 h-5 opacity-40" />
                        </button>
                      ))}
                    </div>
                    {smartSearchQuery.trim() && (
                      <button
                        onClick={() => {
                          triggerSmartFirstAidAi(smartSearchQuery);
                          setShowSuggestions(false);
                        }}
                        className="w-full mt-4 p-4 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-2xl transition-all text-center font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Search custom issue: "{smartSearchQuery}" via Emergency AI
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clickable Quick Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-sm font-bold text-muted-foreground/80 self-center mr-2 uppercase tracking-widest text-[10px]">Quick Taps:</span>
              {COMMON_EMERGENCIES.slice(0, 7).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSmartSearchQuery(item.name);
                    triggerSmartFirstAidAi(item.query);
                  }}
                  className="px-4 py-2.5 bg-muted/40 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full text-xs font-bold transition-all border border-border/80"
                >
                  {item.name.split(' / ')[0]}
                </button>
              ))}
            </div>

            {/* Main AI Instructions Display Panel */}
            <AnimatePresence>
              {isSmartAiLoading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-8 bg-destructive/[0.03] rounded-[2.5rem] border-2 border-dashed border-destructive/20 flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="relative mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center animate-pulse"
                    >
                      <Zap className="w-10 h-10 text-destructive fill-destructive/30" />
                    </motion.div>
                  </div>
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-2 animate-pulse">Contacting Specialist Trauma AI...</h3>
                  <p className="text-muted-foreground font-semibold max-w-md">
                    Retrieving medically reviewed, high-priority emergency workflows. Stay calm and follow instructions.
                  </p>
                </motion.div>
              )}

              {smartAiInstructions && !isSmartAiLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 border-2 border-destructive/20 rounded-[2.5rem] overflow-hidden shadow-2xl bg-destructive/[0.02]"
                >
                  {/* Status Banner */}
                  <div className="bg-destructive p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <LifeBuoy className="w-7 h-7 text-white fill-white/20 animate-bounce" />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] opacity-85">EMERGENCY PROTOCOL GENERATED</span>
                        <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">{smartSearchQuery}</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakInstructions(smartAiInstructions)}
                        className="px-6 py-3 bg-white text-destructive hover:bg-slate-100 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-black/10"
                      >
                        <Volume2 className="w-4 h-4" />
                        Listen (Audio)
                      </button>
                      <button
                        onClick={stopSpeaking}
                        className="p-3 bg-red-800 text-white hover:bg-red-900 rounded-xl transition-all"
                        title="Pause speech"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-8 md:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left Block: Core Flow & Quick Warning Card */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="markdown-body text-foreground/90 font-medium tracking-tight text-lg leading-relaxed shadow-sm bg-background/50 p-6 rounded-3xl border border-border">
                          <Markdown>{smartAiInstructions}</Markdown>
                        </div>
                      </div>

                      {/* Right Block: Instant Assistance Checklist & First Responder Details */}
                      <div className="lg:col-span-1 space-y-6">
                        {/* Red Emergency Action Card */}
                        <div className="bg-destructive/10 border-2 border-destructive p-6 rounded-3xl">
                          <h5 className="text-xl font-black text-destructive uppercase tracking-tighter mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" />
                            DO NOT PANIC
                          </h5>
                          <ul className="space-y-3 font-semibold text-sm text-foreground/80">
                            <li className="flex gap-2">
                              <span className="text-destructive font-black">✓</span> Ensure your own safety first.
                            </li>
                            <li className="flex gap-2">
                              <span className="text-destructive font-black">✓</span> Call emergency dispatchers immediately (911 / 112).
                            </li>
                            <li className="flex gap-2">
                              <span className="text-destructive font-black">✓</span> Keep the patient warm and comforted.
                            </li>
                          </ul>
                          <div className="mt-6">
                            <a
                              href="tel:911"
                              className="w-full py-4 bg-destructive text-white rounded-2xl font-black uppercase tracking-wider text-center flex items-center justify-center gap-2 hover:bg-destructive/95 transition-all shadow-xl shadow-destructive/20 text-sm"
                            >
                              <Phone className="w-4 h-4" />
                              Call 911 Immediately
                            </a>
                          </div>
                        </div>

                        {/* Local Hospital Locator Link */}
                        <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                          <div>
                            <h5 className="text-lg font-black uppercase tracking-tighter text-foreground mb-1">Locate Closest Clinic</h5>
                            <p className="text-xs text-muted-foreground font-semibold leading-relaxed mb-4">
                              Instantly look up the nearest medical emergency center with navigation and active traffic.
                            </p>
                          </div>
                          <a
                            href="/hospitals"
                            className="py-3 bg-muted hover:bg-muted/80 text-foreground font-black uppercase tracking-wider rounded-2xl text-center text-xs flex items-center justify-center gap-2 transition-all border border-border"
                          >
                            <ExternalLink className="w-4 h-4 hover:scale-110 transition-transform" />
                            Open Hospital Locator
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: AI Assistant & Visual Quick Actions */}
          <div className="lg:col-span-1 space-y-8">
            {/* AI First Aid Assistant */}
            <div className="bg-card rounded-[3rem] border-4 border-primary/20 shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                      <Zap className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">AI Assistant</h2>
                  </div>
                  {(aiQuery || aiResponse) && (
                    <button 
                      onClick={handleClearChat}
                      className="p-3 hover:bg-muted rounded-2xl transition-colors text-muted-foreground"
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleAiQuery} className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="What is happening?"
                      className="w-full pl-16 pr-6 py-6 bg-muted/50 border-2 border-border rounded-[2rem] focus:ring-4 focus:ring-primary/20 outline-none transition-all text-xl font-bold text-foreground"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAiLoading || !aiQuery.trim()}
                    className="w-full py-6 bg-primary text-primary-foreground rounded-[2rem] text-xl font-black uppercase tracking-tighter hover:bg-neon-blue-dark transition-all shadow-xl shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isAiLoading ? (
                      <div className="w-8 h-8 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Zap className="w-6 h-6" />
                        Get Help Fast
                      </>
                    )}
                  </button>
                </form>

                <AnimatePresence>
                  {aiResponse && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mt-8 p-8 bg-muted/50 rounded-[2.5rem] border-2 border-primary/20"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <button 
                          onClick={() => speakInstructions(aiResponse)}
                          className="flex-1 py-4 bg-primary/20 text-primary rounded-2xl font-black uppercase tracking-tighter hover:bg-primary/30 transition-all flex items-center justify-center gap-3 border-2 border-primary/30"
                        >
                          <Volume2 className="w-6 h-6" />
                          Listen
                        </button>
                        <button 
                          onClick={stopSpeaking}
                          className="p-4 bg-muted text-muted-foreground rounded-2xl hover:bg-muted/80 transition-all"
                        >
                          <Pause className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="markdown-body text-lg text-foreground/80 leading-tight font-medium">
                        <Markdown>{aiResponse}</Markdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Visual Kit Checklist */}
            <div className="bg-card rounded-[3rem] border border-border shadow-xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                    <CheckSquare className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">First Aid Kit</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { item: 'Bandages', icon: '🩹' },
                    { item: 'Gauze Pads', icon: '🧻' },
                    { item: 'Tape', icon: '🎗️' },
                    { item: 'Antiseptic', icon: '🧴' },
                    { item: 'Gloves', icon: '🧤' },
                    { item: 'Scissors', icon: '✂️' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-muted/50 rounded-2xl group cursor-pointer hover:bg-emerald-500/10 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{item.icon}</span>
                        <span className="text-xl font-black uppercase tracking-tighter text-foreground">{item.item}</span>
                      </div>
                      <div className="w-8 h-8 border-4 border-border rounded-xl flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                        <div className="w-4 h-4 bg-emerald-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Emergency Guides */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Visual Guides</h2>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-16 pr-6 py-4 bg-card border-2 border-border rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none transition-all text-lg font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredGuides.map((guide) => (
                <motion.div
                  key={guide.id}
                  layoutId={guide.id}
                  onClick={() => setSelectedGuide(selectedGuide === guide.id ? null : guide.id)}
                  className={cn(
                    "bg-card rounded-[3rem] border-4 transition-all cursor-pointer group overflow-hidden flex flex-col",
                    selectedGuide === guide.id 
                      ? "border-primary shadow-2xl scale-[1.02]" 
                      : "border-border shadow-xl hover:border-primary/30"
                  )}
                >
                  {/* Animation Preview */}
                  {guide.animation && (
                    <div className="p-4 bg-muted/50">
                      {guide.animation}
                    </div>
                  )}

                  <div className="p-8 flex-grow">
                    <div className="flex items-center justify-between mb-6">
                      <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", guide.color)}>
                        <guide.icon className="w-8 h-8" />
                      </div>
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                        selectedGuide === guide.id ? "bg-primary text-primary-foreground rotate-90" : "bg-muted text-muted-foreground"
                      )}>
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter mb-4 leading-none">{guide.title}</h3>
                    
                    <AnimatePresence>
                      {selectedGuide === guide.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-6"
                        >
                          <div className="h-1 w-full bg-border rounded-full" />
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                speakInstructions(guide.steps.join('. '));
                              }}
                              className="flex-1 py-4 bg-primary/20 text-primary rounded-2xl font-black uppercase tracking-tighter hover:bg-primary/30 transition-all flex items-center justify-center gap-3 border-2 border-primary/30"
                            >
                              <Volume2 className="w-6 h-6" />
                              Listen to Steps
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                stopSpeaking();
                              }}
                              className="p-4 bg-muted text-muted-foreground rounded-2xl hover:bg-muted/80 transition-all"
                            >
                              <Pause className="w-6 h-6" />
                            </button>
                          </div>
                          {guide.steps.map((step, i) => (
                            <div key={i} className="flex gap-6 items-start">
                              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-xl font-black">
                                {i + 1}
                              </div>
                              <p className="text-xl text-foreground/80 font-bold leading-tight pt-1">
                                {step}
                              </p>
                            </div>
                          ))}
                          <div className="pt-8 grid grid-cols-2 gap-4">
                            <button className="py-5 bg-destructive text-destructive-foreground rounded-[1.5rem] text-lg font-black uppercase tracking-tighter hover:bg-destructive/90 transition-all shadow-xl shadow-destructive/20 flex items-center justify-center gap-3">
                              <Phone className="w-6 h-6" />
                              Call 911
                            </button>
                            <button className="py-5 bg-muted text-muted-foreground rounded-[1.5rem] text-lg font-black uppercase tracking-tighter hover:bg-muted/80 transition-all flex items-center justify-center gap-3">
                              <Info className="w-6 h-6" />
                              More
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </GuestOverlay>
    </div>
  );
};

export default FirstAid;

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
import { GoogleGenAI } from "@google/genai";
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

  useEffect(() => {
    const guideParam = searchParams.get('guide');
    if (guideParam) {
      setSelectedGuide(guideParam);
    }
  }, [searchParams]);

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
        model: "gemini-3-flash-preview",
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

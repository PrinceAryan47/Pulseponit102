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

// Visual Animation Component for CPR (Interactive)
const CPRAnimation = () => {
  const [compressions, setCompressions] = useState(0);
  const [bpmFeedback, setBpmFeedback] = useState("Tap to match 100-120 BPM");
  const [lastPress, setLastPress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);

  const handleCompress = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card toggle click!
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 80);
    
    const now = Date.now();
    setCompressions(prev => prev + 1);
    
    if (lastPress > 0) {
      const interval = now - lastPress;
      const bpm = Math.round(60000 / interval);
      if (bpm >= 100 && bpm <= 120) {
        setBpmFeedback("PERFECT TEMPO! (100-120 BPM)");
      } else if (bpm < 100) {
        setBpmFeedback("TOO SLOW! Push faster!");
      } else {
        setBpmFeedback("TOO FAST! Slow down slightly!");
      }
    }
    setLastPress(now);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCompressions(0);
    setBpmFeedback("Tap to start");
    setLastPress(0);
  };

  return (
    <div className="relative w-full h-80 bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-between p-6 overflow-hidden border-2 border-destructive/30 shadow-inner">
      <div className="absolute top-4 left-4 flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-[9px] font-black tracking-widest text-destructive-foreground/50 uppercase">CPR Interactive Training Stage</span>
      </div>

      <div className="flex-1 flex items-center justify-center relative w-full mt-4">
        {/* Human Chest Lying Flat */}
        <div className="relative w-64 h-32 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
          <div className="absolute -left-10 w-12 h-12 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center">
            {/* Nose/mouth indicator */}
            <div className="w-2 h-4 bg-slate-700/50 rounded-full mt-2" />
          </div>
          {/* Heart Area Target */}
          <motion.div 
            className="w-20 h-20 rounded-full flex items-center justify-center relative bg-destructive/10"
            animate={{ 
              scale: isPressing ? 0.82 : [1, 0.96, 1],
              opacity: isPressing ? 0.9 : 0.6
            }}
            transition={{ duration: 0.5, repeat: isPressing ? 0 : Infinity }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-destructive/40 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-destructive font-black text-[10px]">TARGET AREA</span>
          </motion.div>
        </div>

        {/* Rescuer Locking Hands */}
        <motion.div 
          className="absolute z-10 pointer-events-none"
          animate={isPressing ? { y: 20 } : { y: [0, -8, 0] }}
          transition={{ duration: 0.6, repeat: isPressing ? 0 : Infinity }}
        >
          <div className="text-4xl filter drop-shadow-[0_10px_8px_rgba(0,0,0,0.5)]">🙌</div>
        </motion.div>
      </div>

      {/* Control Overlay */}
      <div className="w-full relative z-20 flex items-center justify-between gap-4 mt-2">
        <div className="flex flex-col">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-tight">Compressions: <span className="text-destructive font-black text-sm">{compressions}</span></div>
          <div className={cn(
            "text-[10px] font-black uppercase tracking-tight",
            bpmFeedback.includes("PERFECT") ? "text-emerald-400 font-black" : "text-amber-400"
          )}>{bpmFeedback}</div>
        </div>
        <div className="flex gap-2">
          {compressions > 0 && (
            <button 
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
            >
              Reset
            </button>
          )}
          <button 
            onClick={handleCompress}
            className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-lg shadow-destructive/30"
          >
            Compress
          </button>
        </div>
      </div>
    </div>
  );
};

// Visual Animation for Choking (Heimlich Interactive)
const ChokingAnimation = () => {
  const [success, setSuccess] = useState(false);
  const [thrusts, setThrusts] = useState(0);
  const [isThrusting, setIsThrusting] = useState(false);

  const handleThrust = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (success) return;
    setIsThrusting(true);
    setTimeout(() => setIsThrusting(false), 120);

    const nextThrusts = thrusts + 1;
    setThrusts(nextThrusts);

    if (nextThrusts >= 5) {
      setSuccess(true);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSuccess(false);
    setThrusts(0);
  };

  return (
    <div className="relative w-full h-80 bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-between p-6 overflow-hidden border-2 border-blue-500/30 shadow-inner">
      <div className="absolute top-4 left-4 flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[9px] font-black tracking-widest text-blue-400/70 uppercase">Heimlich Maneuver Trial</span>
      </div>

      <div className="flex-1 flex items-center justify-center relative w-full gap-4 mt-4">
        {/* Victim Outline */}
        <div className="relative flex flex-col items-center">
          {/* Head & Neck */}
          <div className="w-12 h-12 bg-slate-800 rounded-full border border-slate-700 relative">
            {/* Blinking face */}
            <div className="absolute top-4 left-2.5 flex gap-2">
              <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" />
            </div>
            {/* Blocked object */}
            <AnimatePresence>
              {!success && (
                <motion.div 
                  className="absolute bottom-1 right-3.5 w-3.5 h-3.5 bg-red-500 rounded-full border border-white flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <span className="text-[6px] text-white font-bold">☠️</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Torso */}
          <div className="w-20 h-28 bg-slate-800 rounded-t-2xl border-t border-slate-700 flex flex-col items-center justify-center overflow-hidden relative">
            <motion.div 
              className="absolute inset-x-0 bottom-0 bg-blue-500/10"
              animate={isThrusting ? { height: '100%' } : { height: '20%' }}
              transition={{ duration: 0.1 }}
            />
            <span className="text-[8px] font-black text-blue-400/50 uppercase tracking-wider">LUNGS</span>
          </div>
        </div>

        {/* Flying blocked piece */}
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ x: -25, y: -40, opacity: 1, scale: 1.5 }}
              animate={{ x: -160, y: -120, opacity: 0, scale: 0.6, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
            >
              <span className="text-[10px]">🍎</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rescuer Hands */}
        <motion.div 
          className="absolute right-12 z-10 pointer-events-none"
          animate={isThrusting ? { x: -24, scale: 1.15 } : { x: [0, 5, 0] }}
          transition={{ duration: 0.15 }}
        >
          <div className="text-4xl filter drop-shadow-xl">👊</div>
        </motion.div>
      </div>

      <div className="w-full relative z-20 flex items-center justify-between gap-4 mt-2">
        <div className="flex flex-col">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-tight">Thrusts: <span className="text-blue-400 font-black text-sm">{thrusts}/5</span></div>
          <div className={cn(
            "text-[10px] font-black uppercase tracking-tight",
            success ? "text-emerald-400 animate-pulse" : "text-blue-400"
          )}>
            {success ? "OBJECT EXPELLED! AIRWAY CLEAR!" : "Give 5 quick upward thrusts"}
          </div>
        </div>
        <div className="flex gap-2">
          {success && (
            <button 
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
            >
              Reset
            </button>
          )}
          <button 
            onClick={handleThrust}
            disabled={success}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-500/30 disabled:opacity-30"
          >
            Thrust
          </button>
        </div>
      </div>
    </div>
  );
};

// Visual Animation for Bleeding (Interactive Pressure)
const BleedingAnimation = () => {
  const [pressure, setPressure] = useState(0);
  const [applied, setApplied] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const handlePress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (applied) return;
    setIsPressing(true);
    setPressure(prev => {
      const next = prev + 20;
      if (next >= 100) {
        setApplied(true);
        setIsPressing(false);
        return 100;
      }
      return next;
    });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPressure(0);
    setApplied(false);
  };

  return (
    <div className="relative w-full h-80 bg-slate-900 rounded-[2rem] flex flex-col items-center justify-between p-6 overflow-hidden border-2 border-rose-500/30 shadow-inner">
      <div className="absolute top-4 left-4 flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-[9px] font-black tracking-widest text-rose-400/70 uppercase">Vessel Wall Pressure Simulator</span>
      </div>

      <div className="flex-1 flex items-center justify-center relative w-full mt-4">
        {/* Injured limb */}
        <div className="relative w-56 h-14 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-between px-6 shadow-inner">
          {/* Bleeding cut */}
          {!applied ? (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-8 h-2.5 bg-rose-600 rounded-full blur-[1px] animate-pulse" />
              {/* Splatters */}
              <motion.div 
                animate={{ 
                  y: [-5, -20], 
                  opacity: [1, 0], 
                  scale: [1, 1.5]
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1"
              />
            </div>
          ) : (
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-amber-50 text-slate-900 text-[9px] font-black tracking-widest border border-amber-200 rounded-[0.5rem] uppercase flex items-center gap-1.5"
            >
              <span className="text-emerald-500">✓</span> Compressed Bandage Wrap
            </motion.div>
          )}
        </div>

        {/* Pressure Hands overlay */}
        <motion.div 
          className="absolute z-10 pointer-events-none"
          animate={isPressing ? { y: 12, scale: 0.9 } : { y: [-24, -18, -24] }}
          transition={isPressing ? { duration: 0.1 } : { duration: 1.5, repeat: Infinity }}
        >
          <div className="text-4xl filter drop-shadow-2xl">🩹</div>
        </motion.div>
      </div>

      <div className="w-full relative z-20 flex items-center justify-between gap-4 mt-2" onMouseUp={() => setIsPressing(false)} onMouseLeave={() => setIsPressing(false)}>
        <div className="flex flex-col">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-tight">Vessel Compression: <span className="text-rose-400 font-black text-sm">{pressure}%</span></div>
          <div className={cn(
            "text-[10px] font-black uppercase tracking-tight",
            applied ? "text-emerald-400" : "text-rose-400"
          )}>
            {applied ? "BLEEDING CONTROLLED! SECURED." : "Press repeatedly to block arterial flow"}
          </div>
        </div>
        <div className="flex gap-2">
          {pressure > 0 && (
            <button 
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
            >
              Reset
            </button>
          )}
          <button 
            onClick={handlePress}
            disabled={applied}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-lg shadow-rose-500/30 disabled:opacity-30"
          >
            Apply Pressure
          </button>
        </div>
      </div>
    </div>
  );
};

// Visual Animation for Burns (Interactive Running Water)
const BurnsAnimation = () => {
  const [temperature, setTemperature] = useState(42);
  const [cooled, setCooled] = useState(false);
  const [isWaterActive, setIsWaterActive] = useState(false);

  const handleWaterToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWaterActive(!isWaterActive);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWaterActive && temperature > 20) {
      timer = setInterval(() => {
        setTemperature(prev => {
          const next = prev - 1;
          if (next <= 20) {
            setCooled(true);
            setIsWaterActive(false);
            return 20;
          }
          return next;
        });
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isWaterActive, temperature]);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTemperature(42);
    setCooled(false);
    setIsWaterActive(false);
  };

  return (
    <div className="relative w-full h-80 bg-slate-900 rounded-[2rem] flex flex-col items-center justify-between p-6 overflow-hidden border-2 border-orange-500/30 shadow-inner">
      <div className="absolute top-4 left-4 flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <span className="text-[9px] font-black tracking-widest text-orange-400/70 uppercase">Thermal De-escalation simulation</span>
      </div>

      <div className="flex-1 flex items-center justify-center relative w-full mt-4">
        {/* Burned Arm area */}
        <div className="relative w-48 h-12 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center overflow-hidden">
          {/* Inflamed skin */}
          <motion.div 
            className="absolute inset-0 bg-red-600"
            style={{ 
              opacity: (temperature - 20) / 22 
            }}
          />
          <span className="text-[10px] font-black z-10 text-white uppercase tracking-wider relative">
            {temperature}°C - {cooled ? "COOLED & CLEAN" : "HIGH BURNING ENERGY"}
          </span>
        </div>

        {/* Water Stream */}
        <AnimatePresence>
          {isWaterActive && (
            <div className="absolute top-4 flex flex-col items-center pointer-events-none">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 80, opacity: [0, 0.8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1 bg-blue-400 rounded-full h-12 mb-1 blur-[0.5px]"
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full relative z-20 flex items-center justify-between gap-4 mt-2">
        <div className="flex flex-col">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-tight">Tissue Temp: <span className="text-orange-400 font-black text-sm">{temperature}°C</span></div>
          <div className={cn(
            "text-[10px] font-black uppercase tracking-tight",
            cooled ? "text-emerald-400" : isWaterActive ? "text-sky-300 animate-pulse" : "text-orange-400 animate-pulse"
          )}>
            {cooled ? "BURN SAFELY DE-ESCALATED" : isWaterActive ? "COOLING IN PROGRESS (Hold 20m)" : "Activate cool running water source"}
          </div>
        </div>
        <div className="flex gap-2">
          {temperature !== 42 && (
            <button 
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
            >
              Reset
            </button>
          )}
          <button 
            onClick={handleWaterToggle}
            className={cn(
              "px-4 py-2 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-lg",
              isWaterActive ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30" : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/30"
            )}
          >
            {isWaterActive ? "Stop Water" : "Turn On Water"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Visual Animation for Stroke (F.A.S.T Diagnostic Dashboard)
const StrokeAnimation = () => {
  const [fastSelected, setFastSelected] = useState<string | null>(null);

  const criteria = [
    { key: 'F', label: 'Face Droop', desc: 'Is one side drooping or numb? Check if their smile looks uneven.' },
    { key: 'A', label: 'Arm Drift', desc: 'Raise both arms. Does one side slide downwards?' },
    { key: 'S', label: 'Speech Difficulty', desc: 'Is speaking slurred, scrambled, or hard to understand?' },
    { key: 'T', label: 'Time is Tissue', desc: 'Any of these? Call 911 immediately. Every minute matters!' }
  ];

  return (
    <div className="relative w-full h-80 bg-slate-900 rounded-[2.5rem] flex flex-col justify-between p-6 overflow-hidden border-2 border-purple-500/30 shadow-inner text-white">
      <div className="flex justify-between items-center bg-purple-500/10 p-2 rounded-xl mb-2 w-full">
        <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">FAST Diagnostic Assistant</span>
        <Clock className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '40s' }} />
      </div>

      <div className="flex-1 grid grid-cols-4 gap-2 py-2 items-center w-full">
        {criteria.map(c => (
          <button
            key={c.key}
            onClick={(e) => {
              e.stopPropagation(); // prevent card toggle click!
              setFastSelected(fastSelected === c.key ? null : c.key);
            }}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all h-full",
              fastSelected === c.key 
                ? "bg-purple-500 border-white text-white shadow-lg" 
                : "bg-slate-800 border-slate-700 hover:border-purple-400 text-purple-100"
            )}
          >
            <span className="text-xl font-black">{c.key}</span>
            <span className="text-[8px] font-black uppercase tracking-tight text-center">{c.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {fastSelected ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-purple-950/40 p-3 rounded-xl border border-purple-500/20 text-[10px] leading-tight text-purple-200 mt-2 min-h-[50px] flex items-center justify-center text-center font-semibold"
          >
            {criteria.find(c => c.key === fastSelected)?.desc}
          </motion.div>
        ) : (
          <div className="text-[10px] text-slate-400 text-center py-3 font-semibold">
            Tap on any F-A-S-T letter above to understand diagnostic indicators
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Visual Animation for Poisoning (Instant Hotlink Dialing)
const PoisoningAnimation = () => {
  const [dialed, setDialed] = useState(false);

  const handleDial = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card toggle click!
    setDialed(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Connecting you to Poison Control hotline immediately on 1. 8 0 0. 2 2 2. 1 2 2 2");
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative w-full h-80 bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-between p-6 overflow-hidden border-2 border-amber-500/30 shadow-inner">
      <div className="absolute top-4 left-4 flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[9px] font-black tracking-widest text-amber-400/70 uppercase">Poisoning Hotlink Dispatch</span>
      </div>

      <div className="flex-1 flex items-center justify-center gap-6 w-full mt-4">
        {/* Noxious toxic container */}
        <div className="relative w-20 h-28 bg-slate-800 rounded-lg flex flex-col items-center justify-center border border-slate-700">
          <div className="absolute top-0 inset-x-0 h-4 bg-amber-500/20 border-b border-slate-700 flex items-center justify-center">
            <span className="text-[6px] font-black text-amber-400">HAZARD</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500 animate-bounce mt-4" />
          <span className="text-[8px] font-black text-amber-400/80 uppercase mt-1">TOXIC</span>
        </div>

        {/* Dial button */}
        <motion.button 
          onClick={handleDial}
          animate={dialed ? { scale: [1, 1.05, 1] } : { scale: [1, 0.95, 1] }}
          transition={{ duration: dialed ? 0.4 : 1.5, repeat: Infinity }}
          className={cn(
            "w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all p-3 shadow-xl cursor-pointer",
            dialed 
              ? "bg-emerald-500 border-white text-white shadow-emerald-500/30" 
              : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20"
          )}
        >
          <Phone className={cn("w-6 h-6 mb-1", dialed && "animate-ping")} />
          <span className="text-[8px] font-black uppercase text-center tracking-tight leading-none">
            {dialed ? "DIALED!" : "DIAL TOX"}
          </span>
          <span className="text-[6px] tracking-tighter opacity-80 mt-1">1-800-222-1222</span>
        </motion.button>
      </div>

      <div className="text-center font-bold text-[10px] text-slate-400 mt-2">
        {dialed ? "🚨 Calling national Poison Control database..." : "Do not wait for symptoms. Reach experts immediately."}
      </div>
    </div>
  );
};

// Interactive Animation for Electric Shock
const ElectricShockAnimation = () => {
  const [powerOff, setPowerOff] = useState(false);
  const [saved, setSaved] = useState(false);
  const [broomThrust, setBroomThrust] = useState(false);

  const handlePowerBreak = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPowerOff(true);
  };

  const handleBroomThrust = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBroomThrust(true);
    setTimeout(() => {
      setBroomThrust(false);
      setSaved(true);
    }, 450);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPowerOff(false);
    setSaved(false);
  };

  return (
    <div className="relative w-full h-80 bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-between p-6 overflow-hidden border-2 border-yellow-500/30 shadow-inner">
      <div className="absolute top-4 left-4 flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-[9px] font-black tracking-widest text-yellow-400/70 uppercase">LIVE CURRENT SEPARATION ENGINE</span>
      </div>

      <div className="flex-1 flex items-center justify-center relative w-full gap-8 mt-4">
        {/* Power switch terminal */}
        <button
          onClick={handlePowerBreak}
          className={cn(
            "p-3 rounded-2xl border flex flex-col items-center transition-all",
            powerOff 
              ? "bg-slate-800 border-slate-700 text-slate-500" 
              : "bg-red-500/20 border-red-500 text-red-500 animate-pulse hover:bg-red-500 hover:text-white"
          )}
        >
          <Zap className="w-6 h-6 mb-1" />
          <span className="text-[8px] font-black uppercase text-center leading-none">
            {powerOff ? "POWER OFF" : "SHUT POWER"}
          </span>
        </button>

        {/* Human in shock */}
        <div className="relative flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
            {saved ? "😴" : "⚡🤕⚡"}
          </div>
          <div className="w-16 h-12 bg-slate-800 rounded-t-xl border-t border-slate-700 mt-1 flex flex-col items-center justify-center relative">
            {!powerOff && !saved && (
              <motion.div 
                className="absolute inset-0 bg-yellow-400/20 animate-pulse"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.1, repeat: Infinity }}
              />
            )}
            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">VICTIM</span>
          </div>
        </div>

        {/* Separator stick */}
        <motion.div
          animate={broomThrust ? { x: -80, rotate: -45 } : { x: 0, rotate: 0 }}
          className="absolute right-6 top-16 transition-all"
        >
          <span className="text-4xl" title="Wooden Broom Stick">🧹</span>
        </motion.div>
      </div>

      <div className="w-full relative z-20 flex items-center justify-between gap-4 mt-2">
        <div className="flex flex-col">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-tight">Status: <span className="text-yellow-400 font-black text-sm">{powerOff ? "LINE DISCHARGED" : saved ? "SEPARATED" : "IN CONTACT"}</span></div>
          <div className={cn(
            "text-[10px] font-black uppercase tracking-tight",
            saved || powerOff ? "text-emerald-400" : "text-yellow-400 animate-pulse"
          )}>
            {powerOff ? "ELECTRIC LINE CUT." : saved ? "Separated with wood broom!" : "ACTIVE SHOCK! Hit Switch/Lever Broom."}
          </div>
        </div>
        <div className="flex gap-2">
          {(powerOff || saved) && (
            <button 
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
            >
              Reset
            </button>
          )}
          <button 
            onClick={handleBroomThrust}
            disabled={saved}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-lg shadow-yellow-500/20 disabled:opacity-30"
          >
            Lever Broom
          </button>
        </div>
      </div>
    </div>
  );
};

// Spine Injury / Fracture Stabilizer Animation
const SpineInjuryAnimation = () => {
  const [stabilized, setStabilized] = useState(false);
  const [timerLeft, setTimerLeft] = useState(100);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isHolding && timerLeft > 0) {
      timer = setInterval(() => {
        setTimerLeft(prev => {
          if (prev <= 0) {
            setStabilized(true);
            setIsHolding(false);
            return 0;
          }
          return prev - 10;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [isHolding, timerLeft]);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStabilized(false);
    setTimerLeft(100);
    setIsHolding(false);
  };

  return (
    <div className="relative w-full h-80 bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-between p-6 overflow-hidden border-2 border-teal-500/30 shadow-inner">
      <div className="absolute top-4 left-4 flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-[9px] font-black tracking-widest text-teal-400/70 uppercase">Cervical Spine Stabilization trainer</span>
      </div>

      <div className="flex-1 flex items-center justify-center relative w-full mt-4">
        {/* Neck spine column line */}
        <div className="relative flex flex-col items-center">
          {/* Head */}
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
            🤕
          </div>
          {/* Spine vertebrae connection */}
          <div className="w-4 h-10 flex flex-col gap-1 my-1">
            {[0, 1, 2].map(i => (
              <motion.div 
                key={i}
                className={cn(
                  "w-full h-2 rounded-[2px] transition-colors",
                  stabilized ? "bg-teal-400 animate-pulse" : isHolding ? "bg-yellow-400 animate-ping" : "bg-red-500 animate-bounce"
                )}
              />
            ))}
          </div>
          {/* Upper chest */}
          <div className="w-24 h-10 bg-slate-800 border-t border-slate-700 rounded-t-xl text-[7px] text-center text-slate-500 font-extrabold pt-2">
            THORACIC STATE
          </div>
        </div>

        {/* Glowing stabilizing braces */}
        <AnimatePresence>
          {stabilized && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute w-20 h-10 border-2 border-teal-400 bg-teal-500/10 rounded-lg flex items-center justify-center text-[8px] font-bold text-teal-300 uppercase tracking-widest"
              style={{ y: -5 }}
            >
              🔒 Collar Secured
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full relative z-20 flex items-center justify-between gap-4 mt-2">
        <div className="flex flex-col">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-tight">Stabilization: <span className="text-teal-400 font-black text-sm">{100 - timerLeft}%</span></div>
          <div className={cn(
            "text-[10px] font-black uppercase tracking-tight",
            stabilized ? "text-emerald-400 font-black" : isHolding ? "text-yellow-400" : "text-amber-400 animate-pulse"
          )}>
            {stabilized ? "SPINE SECURED!" : isHolding ? "Stabilizing head. Stand steady..." : "CRITICAL RISK: Tap and hold stabilizer."}
          </div>
        </div>
        <div className="flex gap-2">
          {timerLeft === 0 && (
            <button 
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
            >
              Reset
            </button>
          )}
          <button 
            onMouseDown={() => setIsHolding(true)}
            onMouseUp={() => setIsHolding(false)}
            onMouseLeave={() => setIsHolding(false)}
            onTouchStart={() => setIsHolding(true)}
            onTouchEnd={() => setIsHolding(false)}
            disabled={stabilized}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-lg shadow-teal-500/20 disabled:opacity-30 select-none"
          >
            {isHolding ? "HOLDING STILL..." : "Hold to Stabilize"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Corneal Ocular Chemical Splash Flush Simulator
const ChemicalEyeAnimation = () => {
  const [splashCleaned, setSplashCleaned] = useState(false);
  const [flushSec, setFlushSec] = useState(15);
  const [isFlushing, setIsFlushing] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFlushing && flushSec > 0) {
      timer = setInterval(() => {
        setFlushSec(prev => {
          if (prev <= 1) {
            setSplashCleaned(true);
            setIsFlushing(false);
            return 0;
          }
          return prev - 1;
        });
      }, 400);
    }
    return () => clearInterval(timer);
  }, [isFlushing, flushSec]);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSplashCleaned(false);
    setFlushSec(15);
    setIsFlushing(false);
  };

  return (
    <div className="relative w-full h-80 bg-slate-900 rounded-[2rem] flex flex-col items-center justify-between p-6 overflow-hidden border-2 border-emerald-500/30 shadow-inner">
      <div className="absolute top-4 left-4 flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] font-black tracking-widest text-emerald-400/70 uppercase">Corneal Contaminant Outflow Simulator</span>
      </div>

      <div className="flex-1 flex items-center justify-center relative w-full gap-4 mt-4">
        {/* Head tilted sideways */}
        <div className="relative flex flex-col items-center rotate-[45deg] transition-all">
          <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex flex-col items-center justify-center relative">
            <div className="flex justify-around w-full px-4 mb-2">
              {/* Splashed Eye - LOWER */}
              <div className="relative w-6 h-4 bg-slate-100 rounded-full flex items-center justify-center border border-slate-900">
                <div className="w-3.5 h-3.5 bg-sky-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                </div>
                {!splashCleaned && (
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute inset-0 bg-yellow-400/50 rounded-full border border-yellow-500"
                  />
                )}
              </div>
              {/* Healthy Eye - HIGHER */}
              <div className="w-6 h-4 bg-slate-100 rounded-full flex items-center justify-center border border-slate-900">
                <div className="w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                </div>
              </div>
            </div>
            <span className="text-[6px] font-bold text-slate-500 uppercase tracking-tight">FLUSH OUTWARDS</span>
          </div>
        </div>

        {/* Flush Cascade Water */}
        <AnimatePresence>
          {isFlushing && (
            <div className="absolute top-10 left-[42%] pointer-events-none flex flex-col items-center">
              <motion.div
                animate={{ y: [0, 80], opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-1.5 bg-sky-300 rounded-full h-16 blur-[0.5px]"
              />
            </div>
          )}
        </AnimatePresence>

        {/* Flowing Out contaminant indicator */}
        <AnimatePresence>
          {isFlushing && !splashCleaned && (
            <motion.div
              initial={{ x: -20, y: 10, opacity: 0.8 }}
              animate={{ x: -60, y: 50, opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute w-3 h-3 bg-yellow-400 rounded-full blur-[1px]"
            />
          )}
        </AnimatePresence>
      </div>

      <div className="w-full relative z-20 flex items-center justify-between gap-4 mt-2">
        <div className="flex flex-col">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-tight">Flush Time: <span className="text-emerald-400 font-black text-sm">{flushSec}s</span></div>
          <div className={cn(
            "text-[10px] font-black uppercase tracking-tight",
            splashCleaned ? "text-emerald-400 font-black" : isFlushing ? "text-sky-300 animate-pulse" : "text-amber-400 animate-pulse"
          )}>
            {splashCleaned ? "CORNEAL RECOVERY OK" : isFlushing ? "Flushing inwards-outwards..." : "CRITICAL: Flush from nose bridge OUT."}
          </div>
        </div>
        <div className="flex gap-2">
          {flushSec !== 15 && (
            <button 
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
            >
              Reset
            </button>
          )}
          <button 
            onClick={() => setIsFlushing(!isFlushing)}
            disabled={splashCleaned}
            className={cn(
              "px-4 py-2 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-lg",
              isFlushing ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
            )}
          >
            {isFlushing ? "Pause" : "Flush Eye"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Common Accidents & Interactive Handling Scenarios
const COMMON_ACCIDENTS = [
  {
    id: 'cooking_scald',
    title: 'Hot Oil Splatters & Cooking Scalds',
    scenario: 'Kitchen and roasting incidents',
    danger: 'Corrosive thermal energy damaging epidermal dermal skin membranes, risking severe infection.',
    animation: <BurnsAnimation />,
    doThis: [
      'De-escalate power/heat and move the patient safely away.',
      'Place injury under cool, flowing clean water immediately for 20 minutes.',
      'Carefully slip off any jewelry, watches, or restrictive rings around the swollen area.',
      'Gently wrap the dry skin using non-stick clean plastic kitchen cling-wrap.'
    ],
    neverDo: [
      'Never rub ice cubes, frozen butter, toothpaste, or grease (these lock thermal heat in and feed bacteria).',
      'Never puncture formed blisters (blisters act as a natural, perfectly sterile, biological membrane shield).'
    ]
  },
  {
    id: 'electric_outlet',
    title: 'High Voltage Shock (Outlet / Wire)',
    scenario: 'Home utility appliance and cord short circuits',
    danger: 'Current disrupts nervous rhythms, threatening heart arrest or heavy interior muscle burns.',
    animation: <ElectricShockAnimation />,
    doThis: [
      'SHUT down power at main breaker before approaching. Do not touch them while live current flows!',
      'If switch is too far, safely push the wire/victim away using a dry wooden broom, paper rolls, or heavy wood piece.',
      'Once safely separate, search for responsive breathing; immediately call 911 if they are unconscious.'
    ],
    neverDo: [
      'Never touch a live shock victim with bare hands or metal elements.',
      'Never throw buckets of water or apply cold metal wraps directly onto live electric shock regions.'
    ]
  },
  {
    id: 'ladder_fall',
    title: 'High Falls & Complex Fractures',
    scenario: 'Falls from ladder, roof, or steep staircases',
    danger: 'Cervical spine disk dislocation, compound open fractures, or interior spinal cord strain.',
    animation: <SpineInjuryAnimation />,
    doThis: [
      'Hold head and neck completely still to lock spine alignment. Do not permit neck twisting or rolling!',
      'Apply solid direct dressing around bleeding points adjacent to a broken bone, avoid applying bone pressure.',
      'Create a temporary secure splint (with rigid magazines, timber, or cardboard straps) to immobilize joints above and below fracture.'
    ],
    neverDo: [
      'Never pull or try to reset a deformed bone limb or pop a displaced joint back into socket manually.',
      'Never transport or move any patient when neck, hip, spine, or pelvis fractures are suspected.'
    ]
  },
  {
    id: 'chemical_eye',
    title: 'Chemical Solution Splash in Eyes',
    scenario: 'Bleach spray, acid cleanser, or paint splash incidents',
    danger: 'Rapid corneal membrane corrosion risking instant sight impairment.',
    animation: <ChemicalEyeAnimation />,
    doThis: [
      'Hold face sideways under a steady stream of clean lukewarm tap water.',
      'Flush inwards-outwards (pour water from nose bridge outwards over the eye so it does not infect the other eye).',
      'Flush continuously for at least 15-20 minutes, then head to emergency room instantly carrying the chemical bottle.'
    ],
    neverDo: [
      'Never scrub or touch the eyes with a dry towel or tissue.',
      'Never drop commercial medicine or neutralizing chemicals into the eyes without physician order.'
    ]
  }
];

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
  const [activeTab, setActiveTab] = useState<'critical' | 'accidents'>('critical');
  const [selectedAccident, setSelectedAccident] = useState<string | null>(null);
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
      const ai = new GoogleGenAI({ apiKey: "" });
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
      const ai = new GoogleGenAI({ apiKey: "" });
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

  const filteredAccidents = COMMON_ACCIDENTS.filter(accident =>
    accident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accident.scenario.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Visual Guides</h2>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Select a practice module to load the interactive training simulator
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search visual list..."
                  className="w-full pl-16 pr-6 py-4 bg-card border-2 border-border rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none transition-all text-lg font-bold"
                />
              </div>
            </div>

            {/* Tab Swapping Header */}
            <div className="flex bg-muted p-2 rounded-[2rem] gap-2 w-full max-w-lg border border-border shadow-inner">
              <button
                onClick={() => {
                  setActiveTab('critical');
                  setSelectedAccident(null);
                }}
                className={cn(
                  "flex-1 py-4 text-center font-black uppercase tracking-tight rounded-2xl text-xs transition-all flex items-center justify-center gap-2",
                  activeTab === 'critical'
                    ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                Life Protocols
              </button>
              <button
                onClick={() => {
                  setActiveTab('accidents');
                  setSelectedGuide(null);
                }}
                className={cn(
                  "flex-1 py-4 text-center font-black uppercase tracking-tight rounded-2xl text-xs transition-all flex items-center justify-center gap-2",
                  activeTab === 'accidents'
                    ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Accident Handling
              </button>
            </div>

            {activeTab === 'critical' ? (
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredAccidents.map((accident) => (
                  <motion.div
                    key={accident.id}
                    layoutId={accident.id}
                    onClick={() => setSelectedAccident(selectedAccident === accident.id ? null : accident.id)}
                    className={cn(
                      "bg-card rounded-[3rem] border-4 transition-all cursor-pointer group overflow-hidden flex flex-col",
                      selectedAccident === accident.id 
                        ? "border-primary shadow-2xl scale-[1.02]" 
                        : "border-border shadow-xl hover:border-primary/30"
                    )}
                  >
                    {/* Animation Preview */}
                    {accident.animation && (
                      <div className="p-4 bg-muted/50">
                        {accident.animation}
                      </div>
                    )}

                    <div className="p-8 flex-grow">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full uppercase tracking-wider">{accident.scenario}</span>
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                          selectedAccident === accident.id ? "bg-primary text-primary-foreground rotate-90" : "bg-muted text-muted-foreground"
                        )}>
                          <ChevronRight className="w-6 h-6" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-2 leading-none">{accident.title}</h3>
                      <p className="text-xs font-semibold text-rose-500 uppercase leading-normal mb-4">Danger: {accident.danger}</p>
                      
                      <AnimatePresence>
                        {selectedAccident === accident.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-6 mt-4"
                          >
                            <div className="h-1 w-full bg-border rounded-full" />
                            
                            {/* Actions to Do */}
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-3">✓ DO THIS IMMEDIATELY</h4>
                              <div className="space-y-3">
                                {accident.doThis.map((step, i) => (
                                  <div key={i} className="flex gap-4 items-start bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-sm font-black">
                                      {i + 1}
                                    </div>
                                    <p className="text-sm text-foreground/80 font-bold leading-tight pt-1.5">
                                      {step}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Critical Warnings */}
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-destructive mb-3">⚠️ NEVER DO THIS</h4>
                              <div className="space-y-3">
                                {accident.neverDo.map((warn, i) => (
                                  <div key={i} className="flex gap-4 items-start bg-destructive/5 p-4 rounded-2xl border border-destructive/10">
                                    <div className="flex-shrink-0 w-8 h-8 bg-destructive text-white rounded-xl flex items-center justify-center text-sm font-black">
                                      !
                                    </div>
                                    <p className="text-sm text-destructive font-bold leading-normal pt-1">
                                      {warn}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-6 grid grid-cols-2 gap-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakInstructions("Immediate actions for " + accident.title + ". " + accident.doThis.join(". ") + " Warnings: " + accident.neverDo.join(". "));
                                }}
                                className="py-4 bg-muted hover:bg-muted/80 text-foreground font-black uppercase tracking-wider rounded-2xl text-xs flex items-center justify-center gap-2 transition-all border border-border"
                              >
                                <Volume2 className="w-5 h-5" />
                                Listen Guide
                              </button>
                              <a 
                                href="tel:911"
                                className="py-4 bg-destructive hover:bg-destructive/95 text-white font-black uppercase tracking-wider rounded-2xl text-[10px] flex items-center justify-center gap-2 transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="w-5 h-5 animate-bounce" />
                                911 Emergency
                              </a>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GuestOverlay>
    </div>
  );
};

export default FirstAid;

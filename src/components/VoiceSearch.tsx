import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface VoiceSearchProps {
  onResult: (text: string) => void;
  placeholder?: string;
  className?: string;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({ onResult, placeholder = "Listening...", className }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recog.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError(event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [onResult]);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      try {
        recognition?.start();
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  if (!recognition) return null;

  return (
    <div className={cn("relative flex items-center", className)}>
      <button
        onClick={toggleListening}
        className={cn(
          "p-3 rounded-2xl transition-all flex items-center justify-center relative overflow-hidden",
          isListening 
            ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-neon-blue border border-slate-200 dark:border-slate-700"
        )}
        title={isListening ? "Stop Listening" : "Voice Search"}
      >
        {isListening ? (
          <MicOff className="w-5 h-5 animate-pulse" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-red-500/20 animate-ping pointer-events-none"
            />
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-full mr-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl border border-white/10"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {placeholder}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute top-full mt-2 right-0 text-[10px] text-red-500 font-bold uppercase tracking-wider whitespace-nowrap">
          {error === 'not-allowed' ? 'Mic Access Denied' : 'Voice Error'}
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;

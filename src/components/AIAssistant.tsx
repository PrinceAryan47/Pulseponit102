import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import VoiceSearch from './VoiceSearch';
import { useAuth } from '../context/AuthContext';

const AIAssistant: React.FC = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('pulsepoint_ai_voice_enabled');
    return saved === 'true';
  });
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your PulsePoint AI assistant. How can I help you navigate our health platform today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    localStorage.setItem('pulsepoint_ai_voice_enabled', voiceEnabled.toString());
    if (!voiceEnabled) {
      window.speechSynthesis.cancel();
    }
  }, [voiceEnabled]);

  const speak = (text: string) => {
    if (!voiceEnabled) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean markdown for better speech
    const cleanText = text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links but keep text
      .replace(/[*_#`~]/g, '') // Remove markdown symbols
      .replace(/\/([a-zA-Z0-9-]+)/g, 'at $1'); // Replace /dashboard with "at dashboard"

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (overrideInput?: string) => {
    const messageToSend = overrideInput || input;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage = messageToSend.trim();
    if (!overrideInput) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = "gemini-3-flash-preview";
      
      const systemInstruction = `You are the PulsePoint AI Assistant, a helpful and professional health guide. 
      Your goal is to help users navigate the app, understand its features, and provide insights into their health metrics.
      
      User Profile Context:
      - Name: ${profile?.fullName || 'Guest'}
      - Age: ${profile?.age || 'Not provided'}
      - Gender: ${profile?.gender || 'Not provided'}
      - Weight: ${profile?.weight ? profile.weight + ' kg' : 'Not provided'}
      - Height: ${profile?.height ? profile.height + ' cm' : 'Not provided'}
      
      Health Metric Calculations (Use these if the user asks for their metrics):
      1. BMI (Body Mass Index): 
         Formula: weight(kg) / (height(m) * height(m))
         Categories: <18.5 (Underweight), 18.5-24.9 (Normal), 25-29.9 (Overweight), 30+ (Obese)
      2. Daily Water Intake:
         Formula: weight(kg) * 0.033 (Result in Liters)
      3. BMR (Basal Metabolic Rate):
         Male: (10 * weight) + (6.25 * height) - (5 * age) + 5
         Female: (10 * weight) + (6.25 * height) - (5 * age) - 161
      4. TDEE (Total Daily Energy Expenditure):
         Formula: BMR * Activity Level (Sedentary: 1.2, Light: 1.375, Moderate: 1.55, Very: 1.725, Extra: 1.9)
      
      NeonHealth Features:
      1. Dashboard: Overview of appointments, medical records, and recent chats. Accessible via /dashboard.
      2. Doctor Directory: Find specialists, book appointments, and start chats or video/audio calls. Accessible via /doctors.
      3. Hospital Directory: Find nearby medical facilities. Accessible via /hospitals.
      4. Health Tools: Access a comprehensive suite of tools including BMI, Calorie, Water Intake, Heart Rate, Pregnancy Due Date, Period Tracker, Sleep calculators, and a Personalized Fitness Workout Planner. Also includes an AI-powered Symptom Checker. Accessible via /health-tools.
      5. Medical Records: View and manage your personal health history. Accessible via /medical-records.
      6. Articles: Read health news and educational content. Accessible via /articles.
      7. Profile: Manage personal information and settings (including weight/height). Accessible via /profile.
      
      Guidelines:
      - Be concise, professional, and empathetic.
      - If a user asks "What's my BMI?" or similar, use their profile data to calculate it. If data is missing (like weight or height), politely ask them to provide it or update their profile at /profile.
      - If a user asks how to do something, provide the direct path or link (e.g., "You can find doctors at /doctors").
      - Do not provide specific medical diagnoses. Instead, suggest they consult a doctor via the Doctor Directory.
      - Use Markdown for formatting (bolding, lists).`;

      const chat = genAI.chats.create({
        model: model,
        config: {
          systemInstruction: systemInstruction,
        },
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }))
      });

      const result = await chat.sendMessage({ message: userMessage });
      const responseText = result.text || "I'm sorry, I couldn't process that request.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      
      // Speak the response if enabled
      if (voiceEnabled) {
        speak(responseText);
      }
    } catch (error) {
      console.error("AI Assistant Error:", error);
      const errorMsg = "I'm having trouble connecting right now. Please try again in a moment.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      if (voiceEnabled) speak(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '64px' : '500px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "w-[calc(100vw-2rem)] sm:w-[380px] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col mb-4 transition-all duration-300",
              isMinimized ? "h-16" : "h-[500px]"
            )}
          >
            {/* Header */}
            <div className="p-4 bg-neon-blue flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-neon-blue" />
                </div>
                <span className="font-bold text-slate-900">PulsePoint AI</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={cn(
                    "p-1 rounded-lg transition-colors",
                    voiceEnabled ? "bg-slate-900/20 text-slate-900" : "hover:bg-slate-900/10 text-slate-900/60"
                  )}
                  title={voiceEnabled ? "Disable Voice Reply" : "Enable Voice Reply"}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-slate-900/10 rounded-lg transition-colors text-slate-900"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-900/10 rounded-lg transition-colors text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 no-scrollbar"
                >
                  {messages.map((msg, idx) => (
                    <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                        msg.role === 'user' 
                          ? "bg-neon-blue text-slate-900 rounded-tr-none" 
                          : "bg-white dark:bg-slate-800 text-[rgb(var(--foreground))] rounded-tl-none border border-slate-100 dark:border-slate-700"
                      )}>
                        <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 flex gap-1">
                        <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask me anything..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-sm text-[rgb(var(--foreground))]"
                      />
                      <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-neon-blue text-slate-900 rounded-xl hover:bg-neon-blue-dark transition-all disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <VoiceSearch onResult={(text) => handleSend(text)} />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={cn(
          "w-14 h-14 bg-neon-blue text-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-neon-blue/20 neon-glow transition-all",
          isOpen && "opacity-0 pointer-events-none"
        )}
      >
        <Sparkles className="w-7 h-7" />
      </motion.button>
    </div>
  );
};

export default AIAssistant;

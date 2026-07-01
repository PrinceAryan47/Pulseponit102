import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  User as UserIcon, 
  Send, 
  Loader2, 
  Sparkles, 
  ShieldAlert, 
  ExternalLink, 
  MapPin, 
  HelpCircle, 
  RotateCcw,
  Volume2,
  VolumeX,
  Compass,
  HeartHandshake,
  Baby,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '../services/aiService';
import Markdown from 'react-markdown';
import GuestOverlay from '../components/GuestOverlay';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  groundingSources?: any[];
}

const ROLES = [
  {
    id: 'general',
    name: 'General Medical Consultant',
    icon: Activity,
    color: 'text-primary bg-primary/10 border-primary/20',
    systemInstruction: 'You are an advanced virtual clinical consultant. Your goal is to analyze symptoms, answer health-related questions, explain complex medical terminology in simple terms, and offer wellness guidance. Always maintain a professional, calm, and reassuring tone. Crucial: Always include a prominent medical disclaimer advising the user to seek immediate in-person professional emergency care if they experience severe symptoms (like chest pain, difficulty breathing, or severe bleeding).'
  },
  {
    id: 'navigator',
    name: 'Hospital & Emergency Navigator',
    icon: Compass,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    systemInstruction: 'You are an urgent health facility navigator. Your task is to help users find the most appropriate medical facilities (hospitals, clinics, specialized clinics, or pharmacies) for their issues. You utilize active Google Maps Grounding to suggest real, verified hospitals and medical centers. When providing facilities, list their real street names, services, and explain why they match the user\'s needs.'
  },
  {
    id: 'pediatric',
    name: 'Pediatric Health Guide',
    icon: Baby,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    systemInstruction: 'You are an empathetic pediatric specialist advising on infant, toddler, and adolescent health. Provide clear, supportive guidance on child development milestones, vaccinations, nutrition, common childhood illnesses (like colic, teething, mild fevers), and sleep training. Remind parents to consult their pediatrician for specialized treatment.'
  },
  {
    id: 'counselor',
    name: 'Mental Well-being Advisor',
    icon: HeartHandshake,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    systemInstruction: 'You are a warm, supportive, and non-judgmental mental well-being counselor. Offer stress-management strategies, breathing exercises, mindfulness techniques, and constructive support for anxiety, burnout, sleep difficulties, and emotional struggles. Note: You are not a crisis counselor; if a user expresses thoughts of self-harm, immediately provide international helplines and encourage professional intervention.'
  }
];

const MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Balanced & Intelligent)', isDefault: true },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Deep Clinical Analytics)', isDefault: false },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Ultra-Fast Response)', isDefault: false }
];

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  general: [
    "What are the early warning signs of appendicitis?",
    "Explain the difference between Type 1 and Type 2 diabetes.",
    "What causes sudden muscle cramps and how can I prevent them?"
  ],
  navigator: [
    "Find emergency hospitals equipped with intensive care units near Kampala.",
    "Recommend a highly-rated pediatric clinic or medical center.",
    "Where is the nearest 24-hour pharmacy or chemist?"
  ],
  pediatric: [
    "How do I soothe a teething infant who is refusing to feed?",
    "What is the recommended vaccination schedule for a 6-month-old?",
    "Tips for establishing a healthy toddler bedtime routine."
  ],
  counselor: [
    "Guide me through a quick, 2-minute breathing exercise for high anxiety.",
    "How can I rebuild my sleep hygiene after weeks of severe burnout?",
    "What are some cognitive reframing techniques for negative self-talk?"
  ]
};

const AiAssistant: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am your AI Health Assistant. I am here to provide medical consultations, suggest nearby facilities with Google Maps Grounding, and support your well-being. Please select a specialized role or ask me anything to get started!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Fetch location on load for Maps Grounding
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => console.log("Location not granted for chatbot:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Text to Speech
  const speakText = (text: string) => {
    if (!speechEnabled) return;
    window.speechSynthesis?.cancel();
    const cleanText = text.replace(/[*_#`\-]/g, ''); // strip markdown chars
    const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 300)); // limit to 300 characters for performance
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis?.speak(utterance);
  };

  const handleResetChat = () => {
    window.speechSynthesis?.cancel();
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: `Hello! I am your AI Health Assistant. I am here to provide medical consultations, suggest nearby facilities with Google Maps Grounding, and support your well-being. Please select a specialized role or ask me anything to get started!`,
        timestamp: new Date()
      }
    ]);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI();
      
      // Reconstruct conversation history formatted for Gemini
      const formattedHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      // Add system instruction as well as user/model history
      const config: any = {
        systemInstruction: selectedRole.systemInstruction
      };

      // Add Google Maps Grounding if 'navigator' role is active OR user asks for locations/hospitals
      const queryLower = textToSend.toLowerCase();
      const needsLocation = selectedRole.id === 'navigator' || queryLower.includes('hospital') || queryLower.includes('clinic') || queryLower.includes('pharmacy') || queryLower.includes('near me') || queryLower.includes('find');
      
      if (needsLocation) {
        config.tools = [{ googleMaps: {} }];
        if (userLocation) {
          config.toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude
              }
            }
          };
        }
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: textToSend }] }
        ],
        config
      });

      // Extract Grounding Sources if present
      const chunks = response.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .map((chunk: any) => {
          if (chunk.maps) {
            return {
              title: chunk.maps.title,
              uri: chunk.maps.uri,
              snippets: chunk.maps.placeAnswerSources?.map((src: any) => src.reviewSnippets).flat().filter(Boolean) || []
            };
          }
          if (chunk.web) {
            return {
              title: chunk.web.title,
              uri: chunk.web.uri
            };
          }
          return null;
        })
        .filter(Boolean);

      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: response.text || "I was unable to formulate a response. Please rephrase your query.",
        timestamp: new Date(),
        groundingSources: sources.length > 0 ? sources : undefined
      };

      setMessages(prev => [...prev, botMsg]);
      speakText(botMsg.text);
    } catch (err: any) {
      console.error("AI Assistant error:", err);
      const errMsg = err?.message || "Error connecting to health analysis service.";
      
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'model',
          text: `⚠️ **Service Error:** ${errMsg}\n\nPlease check your internet connection or verify your model setup.`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <GuestOverlay>
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Top Title Card */}
        <div className="bg-card border border-border p-8 rounded-[2.5rem] mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 text-primary rounded-3xl">
              <Bot className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">AI Health Assistant</h1>
              <p className="text-sm text-muted-foreground mt-1">Multi-turn Gemini clinical advisor & real-time hospital navigator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`p-3.5 rounded-2xl border transition-all ${speechEnabled ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}
              title={speechEnabled ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}
            >
              {speechEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button 
              onClick={handleResetChat}
              className="px-5 py-3.5 bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-foreground border border-border rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Conversation
            </button>
          </div>
        </div>

        {/* Dynamic Selectors Column & Chat Stage Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Side Controller Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Roles Controller */}
            <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Select Specialist Role
              </h3>
              <div className="space-y-2.5">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isActive = selectedRole.id === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        isActive 
                          ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary' 
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className={`p-2 rounded-xl border ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold leading-tight">{role.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model Controller */}
            <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                AI Model Engine
              </h3>
              <div className="space-y-2.5">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                      selectedModel === model.id 
                        ? 'border-primary bg-primary/5 text-foreground font-bold' 
                        : 'border-border bg-card text-muted-foreground text-xs hover:bg-muted/50'
                    }`}
                  >
                    <p className="text-xs font-bold leading-snug">{model.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Disclaimer Security Card */}
            <div className="bg-amber-500/5 p-6 rounded-[2.5rem] border border-amber-500/15 flex gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Clinical Disclaimer</h4>
                <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 leading-relaxed mt-1">
                  AI suggestions are purely informative guides and are NOT substitutes for qualified clinical decisions. Call emergency units for acute symptoms.
                </p>
              </div>
            </div>
          </div>

          {/* Chat Interface Column */}
          <div className="lg:col-span-3 flex flex-col h-[650px] bg-card border border-border rounded-[2.5rem] shadow-sm overflow-hidden justify-between">
            
            {/* Active Specialist Header Banner */}
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${selectedRole.color}`}>
                  <selectedRole.icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-foreground">{selectedRole.name} Active</span>
                  <p className="text-[10px] text-muted-foreground">Using Google Maps Grounding as needed</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Ready
              </div>
            </div>

            {/* Scrollable Conversation Stage */}
            <div className="flex-grow p-6 overflow-y-auto space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Bot Avatar */}
                      {!isUser && (
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${selectedRole.color}`}>
                          <selectedRole.icon className="w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
                        </div>
                      )}

                      {/* Message Bubble Container */}
                      <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        <div className={`p-5 rounded-[2rem] border leading-relaxed text-sm ${
                          isUser 
                            ? 'bg-primary text-primary-foreground border-primary rounded-tr-none' 
                            : 'bg-card text-foreground border-border rounded-tl-none shadow-sm'
                        }`}>
                          <div className="markdown-body">
                            <Markdown>{msg.text}</Markdown>
                          </div>
                        </div>

                        {/* Rendering Grounding Sources dynamically inside responses */}
                        {msg.groundingSources && msg.groundingSources.length > 0 && (
                          <div className="mt-3.5 w-full bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-[1.5rem] space-y-3">
                            <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
                              <MapPin className="w-4 h-4 animate-bounce" />
                              VERIFIED GOOGLE MAPS GROUNDING SOURCES
                            </div>
                            <div className="space-y-2.5 mt-1.5">
                              {msg.groundingSources.map((src, sIdx) => (
                                <div key={sIdx} className="bg-card border border-border p-3 rounded-xl flex flex-col justify-between md:flex-row md:items-center gap-2">
                                  <div>
                                    <h5 className="text-xs font-bold text-foreground">{src.title}</h5>
                                    {src.snippets && src.snippets.length > 0 && (
                                      <p className="text-[10px] text-muted-foreground italic mt-1">
                                        "{src.snippets[0]}"
                                      </p>
                                    )}
                                  </div>
                                  {src.uri && (
                                    <a
                                      href={src.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 hover:bg-primary/95 shadow-md shadow-primary/10"
                                    >
                                      View Map <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <span className="text-[10px] text-muted-foreground/60 mt-1.5 px-2">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="w-10 h-10 bg-muted border border-border text-muted-foreground rounded-2xl flex items-center justify-center shrink-0">
                          <UserIcon className="w-5 h-5" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Bot Generating Status Ripple */}
              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 justify-start"
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${selectedRole.color}`}>
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div className="bg-card text-muted-foreground border border-border p-5 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-2.5">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-xs font-semibold">Generating clinical advisor insights...</span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Helper Suggestion Chips */}
            {messages.length === 1 && (
              <div className="px-6 py-4 bg-muted/10 border-t border-border">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
                  <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  Suggested Prompt Starters
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS[selectedRole.id]?.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-xs bg-card hover:bg-muted text-muted-foreground border border-border px-3.5 py-2.5 rounded-xl text-left transition-all font-medium hover:border-primary/40 leading-snug"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Submission Console */}
            <div className="p-4 border-t border-border bg-card">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
                className="flex items-center gap-3 bg-muted/40 p-1.5 border border-border rounded-2xl focus-within:ring-2 focus-within:ring-primary transition-all"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Ask our ${selectedRole.name}...`}
                  disabled={isGenerating}
                  className="flex-grow bg-transparent py-3 px-4 text-sm outline-none text-foreground border-none placeholder-muted-foreground/60"
                />
                
                <button
                  type="submit"
                  disabled={!inputText.trim() || isGenerating}
                  className="p-3 bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground rounded-xl transition-all shadow-md shadow-primary/15 shrink-0 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </GuestOverlay>
  );
};

export default AiAssistant;

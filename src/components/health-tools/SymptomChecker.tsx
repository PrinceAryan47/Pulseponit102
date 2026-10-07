import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Activity, 
  FileDown, 
  Printer, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { generateSymptomCheckerFallback } from '../../utils/offlineHealthData';
import { GoogleGenAI } from '../../services/aiService';
import { cn } from '../../lib/utils';
import { exportSymptomAssessmentDocx } from '../../utils/docxExport';

export const SymptomChecker: React.FC = () => {
  const { profile, user } = useAuth();
  
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

  // Offline Engine & Network States
  const [networkOnline, setNetworkOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isOfflineEngine, setIsOfflineEngine] = useState<boolean>(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // Loaded Source and History states
  const [loadedSource, setLoadedSource] = useState<'ai' | 'fallback' | 'database' | null>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  // Synchronize network online/offline events
  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => {
      setNetworkOnline(false);
      setIsOfflineEngine(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const LOCAL_STORAGE_KEY = 'pulsepoint_offline_symptom_reports';

  const getLocalReports = (): any[] => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveLocalReport = (report: any) => {
    try {
      const existing = getLocalReports();
      const updated = [report, ...existing.filter(r => r.id !== report.id)].slice(0, 40);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Failed to store report locally in offline mode:", e);
      return [];
    }
  };

  // Fetch Saved Reports History (combines Firestore and Local Storage)
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const localReports = getLocalReports();
      let combined: any[] = [...localReports];

      if (user && networkOnline) {
        try {
          const q = query(
            collection(db, 'healthReports'),
            where('userId', '==', user.uid),
            where('type', '==', 'symptom-checker'),
            orderBy('createdAt', 'desc')
          );
          const snap = await getDocs(q);
          const cloudReports = snap.docs.map(doc => ({ id: doc.id, isCloud: true, ...doc.data() }));
          
          const cloudIds = new Set(cloudReports.map(c => c.id));
          const localOnly = localReports.filter(l => !cloudIds.has(l.id));
          combined = [...cloudReports, ...localOnly].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } catch (dbErr) {
          console.warn("Firestore unreachable, using local storage reports:", dbErr);
        }
      }

      setSavedReports(combined);
    } catch (err) {
      console.error("Error fetching symptom checker history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user, networkOnline]);

  const loadReport = (report: any) => {
    setAge(report.inputCriteria?.age?.toString() || '');
    setGender(report.inputCriteria?.gender || 'male');
    setPregnancyStatus(report.inputCriteria?.pregnancyStatus || 'no');
    setSymptoms(report.inputCriteria?.symptoms || '');
    setSeverity(report.inputCriteria?.severity || '5');
    setTrend(report.inputCriteria?.trend || 'stable');
    setDuration(report.inputCriteria?.duration || '');
    setSelectedSymptoms(report.inputCriteria?.selectedSymptoms || []);
    setHistory(report.inputCriteria?.history || '');
    setAllergiesMedications(report.inputCriteria?.allergiesMedications || '');
    setTriggers(report.inputCriteria?.triggers || '');

    setAnalysis(report.reportText);
    const parsed = parseAnalysis(report.reportText);
    setParsedResult(parsed);
    setLoadedSource(report.isCloud ? 'database' : 'fallback');
    setStep(5);
    setActiveResultTab('causes');
  };

  const deleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved symptom assessment?")) return;
    try {
      if (reportId.startsWith('local_')) {
        const existing = getLocalReports();
        const filtered = existing.filter(r => r.id !== reportId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      } else {
        await deleteDoc(doc(db, 'healthReports', reportId));
      }
      setSavedReports(prev => prev.filter(r => r.id !== reportId));
      if (analysis && savedReports.find(r => r.id === reportId)?.reportText === analysis) {
        setAnalysis(null);
        setParsedResult(null);
        setLoadedSource(null);
      }
    } catch (err) {
      console.error("Error deleting symptom checker report:", err);
    }
  };

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

  const QUICK_DURATIONS = [
    'Sudden (< 2 hours)',
    'Today (2-12 hours)',
    '1 - 2 days',
    '3 - 7 days',
    '1 - 3 weeks',
    'Chronic (> 1 month)'
  ];

  const QUICK_HISTORIES = [
    'Hypertension',
    'Type 2 Diabetes',
    'Asthma',
    'Heart Condition',
    'GERD / Acid Reflux',
    'None reported'
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

    if (!sections.treatments && !sections.prevention && !sections.firstaid && !sections.resources) {
      return null;
    }

    return sections;
  };

  const handleExportDocx = async () => {
    if (!analysis) return;
    setIsExportingDocx(true);
    try {
      await exportSymptomAssessmentDocx({
        age,
        gender: `${gender}${pregnancyStatus === 'yes' ? ' (Pregnant)' : ''}`,
        duration,
        severity: parseInt(severity, 10) || 5,
        selectedSymptoms,
        history,
        allergiesMedications,
        triggers,
        parsed: parsedResult || parseAnalysis(analysis)
      });
    } catch (exportErr) {
      console.error("Failed to generate docx symptom assessment:", exportErr);
      alert("Unable to export docx file. Please use the Print option instead.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  const checkSymptoms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    
    setLoading(true);
    setAnalysis(null);
    setParsedResult(null);
    setLoadedSource(null);

    let generatedText = "";
    let sourceUsed: 'ai' | 'fallback' = 'ai';

    const criteriaData = {
      age: parseInt(age, 10) || 30,
      gender,
      pregnancyStatus,
      symptoms,
      severity: parseInt(severity, 10) || 5,
      trend,
      duration: duration || 'Unspecified',
      selectedSymptoms,
      history: history || 'none reported',
      allergiesMedications: allergiesMedications || 'none reported',
      triggers: triggers || 'none reported'
    };

    if (isOfflineEngine || !networkOnline) {
      generatedText = generateSymptomCheckerFallback(criteriaData);
      sourceUsed = 'fallback';
    } else {
      try {
        const ai = new GoogleGenAI();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `As an advanced, clinically-grounded medical symptom checker assistant, analyze the following patient details. All potential insights, differentials, and timelines must be meticulously cross-referenced against world-class clinical databases (including Mayo Clinic, National Institutes of Health (NIH) databases, Centers for Disease Control and Prevention (CDC) clinical guidance, and NHS standard guidelines) to ensure the safe, highly structured, and educational nature of the generated information.

Patient Configuration Details:
- Age: ${age || 'Unspecified'}
- Biological Gender: ${gender}
- Pregnancy Status: ${gender === 'female' || gender === 'other' ? pregnancyStatus : 'N/A'}
- Primary Symptoms: ${symptoms}
- Severity (1-10): ${severity}
- Progression Trend: ${trend}
- Symptom Duration: ${duration || 'Unspecified'}
- Associated Symptoms: ${selectedSymptoms.join(', ') || 'None selected'}
- Pre-existing Conditions / Medical History: ${history || 'None reported'}
- Allergies & Active Medications: ${allergiesMedications || 'None reported'}
- Environmental Context / Triggers: ${triggers || 'None reported'}

Instructions:
1. Deeply correlate EVERY single input provided: evaluate how the duration (${duration}) impacts acute vs chronic timelines; assess whether severity (${severity}/10) warrants immediate emergency care; cross-reference pre-existing conditions (${history}) and active medications (${allergiesMedications}) for contraindications or drug side effects; assess demographic vulnerabilities (${age} yrs old, ${gender}${pregnancyStatus === 'yes' ? ', pregnant' : ''}).
2. You MUST structure your response into exactly 5 distinct sections, each preceded by its corresponding section tag EXACTLY as shown below:

[SECTION_1: POTENTIAL_CAUSES]
### Clinical Patient Profile & Triage Summary
- Explicitly state the triage urgency level: 🚨 CRITICAL EMERGENCY, 🟠 URGENT CARE, 🟡 PRIMARY CARE CONSULT, or 🟢 ROUTINE / SELF-CARE.
- Provide a clear breakdown of potential health conditions (educational possibilities, NOT a formal medical diagnosis).
- Detail evidence-based clinical practice pathways and differential likelihoods (e.g. per Mayo Clinic, CDC, or NHS guidelines).

[SECTION_2: TREATMENT_PATHWAYS]
## Evidence-Based Treatment Pathways
- Detail typical therapies, over-the-counter or prescription protocols commonly used conforming to clinical standards, and home care practices.
- Highlight when a treatment must only be done under professional supervision.
- Highlight any medication warnings or contraindications based on the patient's reported allergies/medications (${allergiesMedications}).

[SECTION_3: PREVENTION_STRATEGIES]
## Preventive Care & Lifestyle Adjustments
- Outline evidence-backed prevention guidelines (hygiene, vaccines, specific dietary restrictions, sleep alterations, etc.).
- Detail physical or lifestyle adjustments to prevent recurrence.

[SECTION_4: FIRST_AID_PROTOCOLS]
## First Aid & Critical Warning Red Flags
- Detail clear immediate physical first aid actions if appropriate.
- Outline critical red-flag emergency symptoms/warning signs (e.g. chest pain, difficulty breathing, sudden numbness) that require immediate urgent/emergency clinical assistance.

[SECTION_5: CLINICAL_RESOURCES]
## Doctor Screening Checkpoints & Verified Sources
- Provide 3-5 high-value, precise questions the patient should directly ask their consulting primary care provider.
- Provide a verified educational directory table referencing trustworthy medical platforms (such as MayoClinic.org, CDC.gov, MedlinePlus) with specific search terms.

Be professional, direct, supportive, and clear. Avoid fluff. Do not use conversational preambles or postambles outside of the sections.`,
        });

        if (response.text && response.text.trim()) {
          generatedText = response.text;
          sourceUsed = 'ai';
        } else {
          throw new Error("Empty response from clinical AI engine.");
        }
      } catch (err) {
        console.warn("Live AI clinical analysis unavailable or offline. Seamlessly utilizing PulsePoint's resilient local clinical engine.", err);
        generatedText = generateSymptomCheckerFallback(criteriaData);
        sourceUsed = 'fallback';
      }
    }

    setAnalysis(generatedText);
    const parsed = parseAnalysis(generatedText);
    setParsedResult(parsed);
    setLoadedSource(sourceUsed);
    setLoading(false);
    setActiveResultTab('causes');

    const reportItem = {
      id: 'local_' + Date.now(),
      userId: user?.uid || 'offline-guest',
      type: 'symptom-checker',
      inputCriteria: criteriaData,
      reportText: generatedText,
      createdAt: new Date().toISOString(),
      isOffline: sourceUsed === 'fallback' || !networkOnline
    };
    saveLocalReport(reportItem);

    if (generatedText && user && networkOnline) {
      try {
        await addDoc(collection(db, 'healthReports'), {
          userId: user.uid,
          type: 'symptom-checker',
          inputCriteria: criteriaData,
          reportText: generatedText,
          createdAt: new Date().toISOString()
        });
      } catch (saveErr) {
        console.warn("Could not save to Firestore, cached safely in offline storage:", saveErr);
      }
    }
    fetchHistory();
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

  const stepLabels = [
    { title: "Profile", desc: "Age & Gender" },
    { title: "Symptoms", desc: "Main issues" },
    { title: "Timeline", desc: "Duration & more" },
    { title: "Background", desc: "Medical History" },
    { title: "Triggers", desc: "Context" }
  ];

  return (
    <div id="advanced-symptom-checker" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="symptom-checker-title" className="text-2xl font-bold text-foreground mb-1">Advanced Symptom Checker</h2>
          <p id="symptom-checker-subtitle" className="text-muted-foreground text-sm">Complete the five diagnostic sections to receive a comprehensive clinically-grounded report.</p>
        </div>
      </div>
      
      {/* Offline Mode & Clinical Engine Switcher */}
      <div className="bg-card border border-border p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className={cn(
            "p-3 rounded-2xl flex items-center justify-center shrink-0",
            isOfflineEngine ? "bg-amber-500/15 text-amber-500" : "bg-primary/15 text-primary"
          )}>
            {isOfflineEngine ? <Shield className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-foreground">
                {isOfflineEngine ? "Offline Clinical Engine Active" : "Live Cloud AI Diagnostic Mode"}
              </h4>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                networkOnline 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              )}>
                {networkOnline ? "Online" : "Device Offline"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isOfflineEngine 
                ? "⚡ Zero-latency local processing grounded in Mayo Clinic, CDC, NIH & NHS medical databases."
                : "✨ Powered by clinical AI with deep cross-referencing and automatic offline fallback."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsOfflineEngine(false)}
            disabled={!networkOnline}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer",
              !isOfflineEngine 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-background border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            title={!networkOnline ? "Device is offline. Connect to network for Cloud AI." : "Use live AI model"}
          >
            <Sparkles className="w-3.5 h-3.5" /> Live Cloud AI
          </button>
          <button
            type="button"
            onClick={() => setIsOfflineEngine(true)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer",
              isOfflineEngine 
                ? "bg-amber-500 text-slate-900 border-amber-500 shadow-sm" 
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
            title="Use local offline medical knowledge base"
          >
            <Shield className="w-3.5 h-3.5" /> ⚡ Offline Engine
          </button>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div id="stepper-card" className={cn("bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm", user ? "lg:col-span-8" : "lg:col-span-12")}>
        
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
                      if (num < step) setStep(num);
                      else if (num === step + 1) handleNext();
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 cursor-pointer",
                      isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                      isActive && "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/25 scale-110",
                      !isActive && !isCompleted && "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : num}
                  </button>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider mt-2 text-center hidden md:block",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {sl.title}
                  </span>
                  <span className="text-[9px] text-muted-foreground/80 mt-0.5 text-center hidden lg:block">
                    {sl.desc}
                  </span>
                </div>
              );
            })}
            
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 -z-10" 
              style={{ width: `${((Math.max(1, step) - 1) / (stepLabels.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={checkSymptoms} className="space-y-6">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-bold text-foreground">Section 1: Demographics & Profile</h3>
                  <p className="text-xs text-muted-foreground">Basic demographic indicators help tailor age-and-gender-related clinical diagnostic rules.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-5 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                      placeholder="Enter age (e.g. 32)"
                      min="0"
                      max="125"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">Biological Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-5 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
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
                            "px-5 py-2.5 rounded-xl font-semibold text-xs capitalize transition-all border cursor-pointer",
                            pregnancyStatus === status 
                              ? "bg-purple-500/15 border-purple-500 text-purple-400" 
                              : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
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

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-bold text-foreground">Section 2: Primary Symptoms & Trend</h3>
                  <p className="text-xs text-muted-foreground">Describe what you are currently feeling and the trend of these feelings.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Describe Your Primary Symptoms <span className="text-red-500">*</span></label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all min-h-[120px] resize-none text-foreground"
                    placeholder="e.g., Throbbing localized pain on the right side of my head, accompanied by visual flickering, and sensitivity to bright lights..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">Symptom Intensity / Severity (1-10)</label>
                    <div className="flex items-center gap-4 px-5 py-3.5 bg-muted/50 border border-border rounded-2xl">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        className="flex-grow h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="font-bold text-primary text-lg w-6 text-center">{severity}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">Symptom Trend over Time</label>
                    <select
                      value={trend}
                      onChange={(e) => setTrend(e.target.value)}
                      className="w-full px-5 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
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

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-bold text-foreground">Section 3: Timeline & Associated Symptoms</h3>
                  <p className="text-xs text-muted-foreground">Identify how long you've been sick and any secondary markers.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">How long have you had these symptoms? <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-5 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                    placeholder="e.g., 3 days, 1 week, since this morning"
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-[11px] text-muted-foreground mr-1">Quick pick:</span>
                    {QUICK_DURATIONS.map((qd) => (
                      <button
                        key={qd}
                        type="button"
                        onClick={() => setDuration(qd)}
                        className={cn(
                          "px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer",
                          duration === qd
                            ? "bg-primary/15 border-primary text-primary font-bold shadow-xs"
                            : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {qd}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-3">Do you have any of these associated symptoms? (Select all that apply)</label>
                  <div className="flex flex-wrap gap-2.5">
                    {COMMON_ASSOCIATED_SYMPTOMS.map((symptom) => {
                      const isSelected = selectedSymptoms.includes(symptom);
                      return (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => handleSymptomToggle(symptom)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-semibold transition-all border duration-200 cursor-pointer",
                            isSelected 
                              ? "bg-primary/15 border-primary text-primary shadow-sm" 
                              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
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

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-bold text-foreground">Section 4: Medical History & Background</h3>
                  <p className="text-xs text-muted-foreground">Underlying medical history or chronic conditions can severely impact triage assessments.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Pre-existing Medical Conditions / History (Optional)</label>
                  <textarea
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    className="w-full px-5 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all min-h-[90px] resize-none text-foreground"
                    placeholder="e.g. Hypertension, asthma, diabetes, heart condition, none..."
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-[11px] text-muted-foreground mr-1">Common conditions:</span>
                    {QUICK_HISTORIES.map((qh) => (
                      <button
                        key={qh}
                        type="button"
                        onClick={() => {
                          if (qh === 'None reported') {
                            setHistory('None reported');
                          } else {
                            setHistory(prev => {
                              if (!prev || prev === 'None reported') return qh;
                              if (prev.includes(qh)) return prev;
                              return `${prev}, ${qh}`;
                            });
                          }
                        }}
                        className={cn(
                          "px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer",
                          history.includes(qh)
                            ? "bg-purple-500/15 border-purple-500 text-purple-400 font-bold shadow-xs"
                            : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        + {qh}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Known Allergies & Active Medications (Optional)</label>
                  <textarea
                    value={allergiesMedications}
                    onChange={(e) => setAllergiesMedications(e.target.value)}
                    className="w-full px-5 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all min-h-[90px] resize-none text-foreground"
                    placeholder="e.g. Allergic to penicillin. Currently taking 10mg Lisinopril daily..."
                  />
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-bold text-foreground">Section 5: Triggers, Exposures & Environmental Context</h3>
                  <p className="text-xs text-muted-foreground">Environmental context can highlight toxic, viral, bacterial, or traumatic triggers.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Recent Travel, Injuries, Sick Contacts, or Stressors (Optional)</label>
                  <textarea
                    value={triggers}
                    onChange={(e) => setTriggers(e.target.value)}
                    className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all min-h-[140px] resize-none text-foreground"
                    placeholder="e.g., Traveled recently, was bitten by an insect, or exposed to someone with infectious symptoms..."
                  />
                </div>

                <div className="p-4 bg-muted/40 border border-border text-muted-foreground rounded-2xl flex gap-3 text-xs leading-relaxed">
                  <Info className="w-5 h-5 shrink-0 text-muted-foreground" />
                  <p>
                    <strong>Educational Guidance:</strong> This digital symptom evaluation is driven by clinical databases but does not constitute, replace, or override a professional in-person medical diagnosis. If you are experiencing serious, acute symptoms, please seek emergency medical attention.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          <div id="form-nav-buttons" className="flex justify-between items-center pt-4 border-t border-border mt-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={cn(
                "px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer",
                step === 1 
                  ? "opacity-40 cursor-not-allowed border-transparent text-muted-foreground" 
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !symptoms.trim()}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-extrabold text-xs tracking-wider uppercase hover:bg-neon-blue-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed neon-glow flex items-center gap-2 cursor-pointer"
              >
                {loading ? 'Analyzing Data...' : 'Submit Assessment Report'}
              </button>
            )}
          </div>
        </form>
      </div>

      {(user || savedReports.length > 0) && (
        <div className="lg:col-span-4 bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>📂 Saved Assessments</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground font-normal">
                {savedReports.length}
              </span>
            </span>
            {historyLoading && <span className="text-[10px] text-muted-foreground animate-pulse font-normal">Loading...</span>}
          </h3>
          {savedReports.length === 0 ? (
            <p className="text-xs text-muted-foreground italic leading-relaxed">No saved assessments yet. Complete an assessment to save it automatically in the database or offline storage.</p>
          ) : (
            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {savedReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => loadReport(report)}
                  className={cn(
                    "group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none text-left",
                    analysis === report.reportText
                      ? "bg-primary/10 border-primary/40 shadow-xs"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded",
                        (report.inputCriteria?.severity || 5) >= 8 
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : (report.inputCriteria?.severity || 5) >= 5
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      )}>
                        Sev {report.inputCriteria?.severity || 5}/10
                      </span>
                      {report.isOffline && (
                        <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                          Offline
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground">• {new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs font-bold text-foreground truncate capitalize">
                      {report.inputCriteria?.symptoms}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {report.inputCriteria?.age} yrs • {report.inputCriteria?.gender} • {report.inputCriteria?.trend}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteReport(report.id, e)}
                    className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
                    title="Delete assessment"
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

      {analysis && (
        <motion.div 
          id="symptom-analysis-results"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
            <div className="flex items-center gap-2.5 text-primary">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-foreground">Clinical Triage & Symptom Breakdown</h3>
                <p className="text-xs text-muted-foreground">Comprehensive multi-factor health evaluation based on entered criteria.</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {loadedSource === 'database' && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cloud Loaded
                </span>
              )}
              {loadedSource === 'fallback' && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500 rounded-xl">
                  <Shield className="w-3.5 h-3.5" /> ⚡ Offline Clinical Engine
                </span>
              )}
              {loadedSource === 'ai' && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-500 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5" /> Live Cloud AI Generated
                </span>
              )}

              <button
                type="button"
                onClick={handleExportDocx}
                disabled={isExportingDocx}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-all border border-border cursor-pointer"
                title="Download formatted clinical document (.docx)"
              >
                <FileDown className="w-3.5 h-3.5 text-primary" />
                <span>{isExportingDocx ? 'Exporting...' : 'Word (.docx)'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-all border border-border cursor-pointer"
                title="Print report"
              >
                <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Print</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-muted/40 border border-border rounded-2xl mb-8">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>Correlated Patient Data & Triage Criteria</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-2.5 bg-background border border-border rounded-xl">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Demographics</span>
                <span className="font-bold text-foreground">
                  {age || '30'} yrs • {gender}
                  {pregnancyStatus === 'yes' ? ' (Pregnant)' : ''}
                </span>
              </div>
              <div className="p-2.5 bg-background border border-border rounded-xl">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Severity Score</span>
                <span className={cn(
                  "font-bold",
                  parseInt(severity, 10) >= 8 ? "text-red-500" : parseInt(severity, 10) >= 5 ? "text-amber-500" : "text-emerald-500"
                )}>
                  {severity}/10 • {parseInt(severity, 10) >= 8 ? 'High / Critical' : parseInt(severity, 10) >= 5 ? 'Moderate' : 'Mild'}
                </span>
              </div>
              <div className="p-2.5 bg-background border border-border rounded-xl">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Duration</span>
                <span className="font-bold text-foreground">{duration || 'Unspecified'}</span>
              </div>
              <div className="p-2.5 bg-background border border-border rounded-xl">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Progression</span>
                <span className="font-bold text-foreground capitalize">{trend}</span>
              </div>
              <div className="p-2.5 bg-background border border-border rounded-xl">
                <span className="text-[10px] text-muted-foreground block mb-0.5">History</span>
                <span className="font-bold text-foreground truncate block" title={history || 'None reported'}>
                  {history || 'None reported'}
                </span>
              </div>
              <div className="p-2.5 bg-background border border-border rounded-xl">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Medications / Allergies</span>
                <span className="font-bold text-foreground truncate block" title={allergiesMedications || 'None reported'}>
                  {allergiesMedications || 'None reported'}
                </span>
              </div>
            </div>

            {selectedSymptoms.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground mr-1">Associated Markers:</span>
                {selectedSymptoms.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-md text-[10px] font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {parsedResult ? (
            <div id="tabbed-results" className="space-y-6">
              <div className="flex flex-wrap gap-2 border-b border-border pb-2">
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
                        "flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all border duration-150 cursor-pointer",
                        isActive 
                          ? "bg-muted border-border text-primary shadow-sm" 
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", tab.color)} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-2 sm:p-4 bg-muted/20 rounded-2xl min-h-[250px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeResultTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="markdown-body text-foreground/90 leading-relaxed max-w-none"
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
                        <div className="flex items-center gap-2 text-rose-500 text-sm font-bold bg-rose-500/10 w-fit px-3.5 py-1.5 rounded-full mb-2">
                          <AlertTriangle className="w-4 h-4" /> Immediate Care & Red Flags
                        </div>
                        <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl mb-4 text-xs text-red-500 leading-relaxed font-semibold">
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
            <div className="markdown-body text-foreground/90 leading-relaxed">
              <Markdown>{analysis}</Markdown>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SymptomChecker;

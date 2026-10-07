import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Shield, 
  Info 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { generateMensHealthFallback } from '../../utils/offlineHealthData';
import { GoogleGenAI } from '../../services/aiService';
import { cn } from '../../lib/utils';

export const MensHealthGuide: React.FC = () => {
  const { profile, user } = useAuth();
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [focus, setFocus] = useState('overall');
  const [activity, setActivity] = useState('moderate');
  const [familyHistory, setFamilyHistory] = useState('none');
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);
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
        where('type', '==', 'mens-health'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const reports = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedReports(reports);
    } catch (err) {
      console.error("Error fetching mens-health history:", err);
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
    setFocus(report.inputCriteria?.focus || 'overall');
    setActivity(report.inputCriteria?.activity || 'moderate');
    setFamilyHistory(report.inputCriteria?.familyHistory || 'none');
    setGuide(report.reportText);
    setLoadedSource('database');
  };

  // Delete a report from history
  const deleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved guide?")) return;
    try {
      await deleteDoc(doc(db, 'healthReports', reportId));
      setSavedReports(prev => prev.filter(r => r.id !== reportId));
      if (guide && savedReports.find(r => r.id === reportId)?.reportText === guide) {
        setGuide(null);
        setLoadedSource(null);
      }
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

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

  const [checkedScreenings, setCheckedScreenings] = useState<Record<string, boolean>>({});

  const toggleScreening = (id: string) => {
    setCheckedScreenings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age) return;
    
    setLoading(true);
    setGuide(null);
    setLoadedSource(null);
    
    let generatedText = "";
    let sourceUsed: 'ai' | 'fallback' = 'ai';

    try {
      const ai = new GoogleGenAI({ apiKey: "" });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
      
      if (response.text) {
        generatedText = response.text;
        sourceUsed = 'ai';
      } else {
        throw new Error("Empty response from AI engine.");
      }
    } catch (err) {
      console.warn("AI generation failed. Proceeding with robust, customized local database generation.", err);
      generatedText = generateMensHealthFallback({ age: parsedAge, focus, activity, familyHistory });
      sourceUsed = 'fallback';
    } finally {
      setGuide(generatedText);
      setLoadedSource(sourceUsed);
      setLoading(false);

      if (generatedText && user) {
        try {
          await addDoc(collection(db, 'healthReports'), {
            userId: user.uid,
            type: 'mens-health',
            inputCriteria: { age: parsedAge, focus, activity, familyHistory },
            reportText: generatedText,
            createdAt: new Date().toISOString()
          });
          fetchHistory();
        } catch (saveErr) {
          console.error("Error persisting generated health guide to DB:", saveErr);
        }
      }
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
      
      <div className="bg-muted/40 border border-border p-5 rounded-3xl mb-8 flex flex-col sm:flex-row gap-4 items-start">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-foreground mb-1">Peer-Reviewed Preventive Frameworks</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            All age-graded diagnostic screenings, checkups, and cardiological warning indicators are matched against current preventive guidelines established by elite clinical academies:
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold tracking-wider uppercase">
            <span className="px-2.5 py-1 bg-muted border border-border rounded-md text-foreground/80">USPSTF Guidelines</span>
            <span className="px-2.5 py-1 bg-muted border border-border rounded-md text-foreground/80">American Cancer Society (ACS)</span>
            <span className="px-2.5 py-1 bg-muted border border-border rounded-md text-foreground/80">American Heart Assoc. (AHA)</span>
            <span className="px-2.5 py-1 bg-muted border border-border rounded-md text-foreground/80">AUA Urology Standard</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={generateGuide} className="bg-muted/30 p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6">
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
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-neon-blue-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 neon-glow text-xs uppercase tracking-wider cursor-pointer"
            >
              {loading ? 'Synthesizing Guide...' : 'Generate Health Guide'}
              <Activity className="w-4 h-4 ml-1" />
            </button>
          </form>

          {user && (
            <div className="bg-muted/30 p-6 sm:p-8 rounded-3xl border border-border/80">
              <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>📂 Saved Health Reports</span>
                {historyLoading && <span className="text-[10px] text-muted-foreground animate-pulse font-normal">Loading...</span>}
              </h3>
              {savedReports.length === 0 ? (
                <p className="text-xs text-muted-foreground italic leading-relaxed">No saved reports. Generate a report above to automatically save it in the database.</p>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => loadReport(report)}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none text-left",
                        guide === report.reportText
                          ? "bg-primary/5 border-primary/40"
                          : "border-border/60 bg-background/50 hover:bg-background hover:border-border"
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-tight text-primary">Aged {report.inputCriteria?.age}</span>
                          <span className="text-[9px] text-muted-foreground">• {new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-bold text-foreground truncate capitalize">
                          Focus: {report.inputCriteria?.focus?.replace('-', ' ')}
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
                      : "bg-background border-border hover:border-border text-foreground/90"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/80 pb-4 mb-6 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Synthesized Guidance Report</span>
              {loadedSource === 'database' && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> DB Loaded
                </span>
              )}
              {loadedSource === 'fallback' && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border text-[10px] font-bold text-muted-foreground rounded-full">
                  <Shield className="w-3.5 h-3.5" /> Offline
                </span>
              )}
              {loadedSource === 'ai' && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-500 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" /> Live AI Generated
                </span>
              )}
            </div>
            <button 
              onClick={() => window.print()}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
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

export default MensHealthGuide;

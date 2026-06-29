// Force Vite re-transpile cache invalidation
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Heart,
  Stethoscope,
  Hospital,
  X,
  MessageSquare,
  Sparkles,
  BookOpen,
  LifeBuoy,
  Globe
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc, getDoc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Appointment, MedicalRecord, UserProfile, Article } from '../types';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "../services/aiService";
import { motion, AnimatePresence } from 'framer-motion';
import GuestOverlay from '../components/GuestOverlay';
import { cn } from '../lib/utils';
import { createNotification } from '../services/notificationService';
import { safeFormat } from '../lib/dateUtils';

const StatCard = React.memo(({ icon: Icon, label, value, trend, colorClass }: any) => (
  <div className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all">
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", colorClass)}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-sm text-muted-foreground font-medium">{label}</p>
    <div className="flex items-end gap-2">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {trend && <span className="text-xs text-primary font-bold mb-1">{trend}</span>}
    </div>
  </div>
));

const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthTip, setHealthTip] = useState<string | null>(null);
  const [healthTipSource, setHealthTipSource] = useState<string>('');
  const [healthTipUrl, setHealthTipUrl] = useState<string>('');
  const [isTipLoading, setIsTipLoading] = useState(false);
  const [tipArticle, setTipArticle] = useState<Article | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [doctorReply, setDoctorReply] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [latestNews, setLatestNews] = useState<Article[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleApproveAccess = async (request: any) => {
    try {
      await updateDoc(doc(db, 'accessRequests', request.id), {
        status: 'approved',
        updatedAt: new Date().toISOString()
      });

      // Create notification for the doctor
      await addDoc(collection(db, 'notifications'), {
        userId: request.doctorId,
        title: "Access Request Approved",
        message: `Patient ${profile?.fullName || 'User'} has approved your request to view their medical records.`,
        type: 'alert',
        read: false,
        createdAt: serverTimestamp()
      });

      alert(`Approved sharing access with Dr. ${request.doctorName || 'Specialist'}.`);
    } catch (error) {
      console.error("Error approving access request:", error);
      alert("Failed to approve request. Please try again.");
    }
  };

  const handleRejectAccess = async (request: any) => {
    try {
      await updateDoc(doc(db, 'accessRequests', request.id), {
        status: 'rejected',
        updatedAt: new Date().toISOString()
      });

      // Create notification for the doctor
      await addDoc(collection(db, 'notifications'), {
        userId: request.doctorId,
        title: "Access Request Declined",
        message: `Patient ${profile?.fullName || 'User'} has declined your request to view their medical records.`,
        type: 'alert',
        read: false,
        createdAt: serverTimestamp()
      });

      alert(`Declined sharing access with Dr. ${request.doctorName || 'Specialist'}.`);
    } catch (error) {
      console.error("Error declining access request:", error);
      alert("Failed to decline request. Please try again.");
    }
  };

  const handleUpdateStatus = React.useCallback(async (status: 'accepted' | 'rejected' | 'completed') => {
    if (!selectedAppointment) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'appointments', selectedAppointment.id), {
        status,
        doctorNotes: doctorReply,
        meetingLink: status === 'accepted' ? meetingLink : (status === 'completed' ? selectedAppointment.meetingLink : null),
        updatedAt: serverTimestamp()
      });

      // Create notification for patient
      const title = `Appointment ${status === 'accepted' ? 'Approved' : status === 'rejected' ? 'Declined' : 'Completed'}`;
      const message = `Dr. ${selectedAppointment.doctorName} has ${status} your appointment for ${safeFormat(selectedAppointment.dateTime, 'MMM dd, yyyy')}.${doctorReply ? ` Note: ${doctorReply}` : ''}${meetingLink && status === 'accepted' ? ` Meeting Link: ${meetingLink}` : ''}`;
      
      await createNotification(selectedAppointment.patientId, title, message, 'appointment');

      setIsReplyModalOpen(false);
      setDoctorReply('');
      setMeetingLink('');
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert("Failed to update appointment status.");
    } finally {
      setIsUpdating(false);
    }
  }, [selectedAppointment, doctorReply, meetingLink]);

  useEffect(() => {
    const selectArticleAndTip = async () => {
      if (latestNews.length === 0) return;
      setIsTipLoading(true);
      try {
        // Select an article based on the current date
        const dayOfMonth = new Date().getDate();
        const selectedArticle = latestNews[dayOfMonth % latestNews.length];
        setTipArticle(selectedArticle);
        setHealthTipSource(selectedArticle.sourceName || selectedArticle.authorName || 'Global Medical Source');
        setHealthTipUrl(selectedArticle.sourceUrl || '');

        // Check if we already have a cached tip for this article/date
        const today = new Date().toISOString().split('T')[0];
        const localCacheKey = `daily_tip_article_${selectedArticle.id}_${today}`;
        const cachedTip = localStorage.getItem(localCacheKey);

        if (cachedTip) {
          setHealthTip(cachedTip);
        } else {
          // Attempt to extract a short, ultra-compelling action tip from the article's text using Gemini!
          try {
            const ai = new GoogleGenAI({ apiKey: "" });
            const response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: `Extract or formulate a compelling, single-sentence action-oriented daily health tip (max 25 words) from the following health article content:
Category: ${selectedArticle.category}
Title: ${selectedArticle.title}
Summary/Content: ${selectedArticle.summary || selectedArticle.content}
Make it highly direct, inspiring, and actionable. Do not wrap it in quotes.`,
            });
            const newTip = response.text.trim().replace(/^["']|["']$/g, '');
            setHealthTip(newTip);
            localStorage.setItem(localCacheKey, newTip);
          } catch (aiErr) {
            console.error("Gemini tip extraction failed, using summary:", aiErr);
            const fallback = selectedArticle.summary.split('.')[0] + '.';
            setHealthTip(fallback);
          }
        }
      } catch (err) {
        console.error("Error setting article tip:", err);
      } finally {
        setIsTipLoading(false);
      }
    };

    selectArticleAndTip();
  }, [latestNews]);

  useEffect(() => {
    const fetchGeneralHealthTip = async () => {
      if (latestNews.length > 0) return; // skip if we have articles
      setIsTipLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const cachedTip = localStorage.getItem(`general_daily_tip_${today}`);
        const cachedSource = localStorage.getItem(`general_daily_tip_source_${today}`);
        const cachedUrl = localStorage.getItem(`general_daily_tip_url_${today}`);
        if (cachedTip && cachedSource) {
          setHealthTip(cachedTip);
          setHealthTipSource(cachedSource);
          setHealthTipUrl(cachedUrl || 'https://www.who.int');
        } else {
          const ai = new GoogleGenAI({ apiKey: '' });
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: "Generate a short, inspiring, and evidence-based daily health tip (max 30 words) for a wellness app. Ensure it has an authoritative credit. Return a JSON object with fields: 'tip' (the single-sentence tip) and 'source' (reputable source name, e.g., 'Mayo Clinic', 'Harvard T.H. Chan School of Public Health', or 'World Health Organization') and 'sourceUrl' (e.g., 'https://www.mayoclinic.org').",
            config: {
              responseMimeType: "application/json"
            }
          });
          
          let parsed = { tip: '', source: '', sourceUrl: '' };
          try {
            parsed = JSON.parse(response.text);
          } catch {
            // fallback
            parsed = { 
              tip: response.text.trim().replace(/^["']|["']$/g, ''),
              source: "World Health Organization",
              sourceUrl: "https://www.who.int"
            };
          }

          const tipText = parsed.tip || "Drink plenty of water throughout the day to support brain function and physical energy.";
          const tipSource = parsed.source || "World Health Organization";
          const tipUrl = parsed.sourceUrl || "https://www.who.int";

          setHealthTip(tipText);
          setHealthTipSource(tipSource);
          setHealthTipUrl(tipUrl);

          localStorage.setItem(`general_daily_tip_${today}`, tipText);
          localStorage.setItem(`general_daily_tip_source_${today}`, tipSource);
          localStorage.setItem(`general_daily_tip_url_${today}`, tipUrl);
        }
      } catch (error) {
        console.error("Error fetching general health tip:", error);
        setHealthTip("Stay hydrated! Drinking enough water is essential for your body's vital functions.");
        setHealthTipSource("Mayo Clinic");
        setHealthTipUrl("https://www.mayoclinic.org");
      } finally {
        setIsTipLoading(false);
      }
    };

    fetchGeneralHealthTip();
  }, [latestNews]);

  useEffect(() => {
    if (!profile || !user) return;

    const currentUserId = user.uid || profile.uid;
    if (!currentUserId) return;

    const qField = profile.role === 'patient' ? 'patientId' : 'doctorId';
    
    const qApp = query(
      collection(db, 'appointments'),
      where(qField, '==', currentUserId),
      orderBy('dateTime', 'desc'),
      limit(5)
    );

    const unsubscribeApp = onSnapshot(qApp, (snap) => {
      setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Appointment)));
    });

    if (profile.role === 'patient') {
      const qRec = query(
        collection(db, 'medicalRecords'),
        where('patientId', '==', currentUserId),
        orderBy('date', 'desc'),
        limit(3)
      );
      const unsubscribeRec = onSnapshot(qRec, (snap) => {
        setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MedicalRecord)));
      });

      const qNews = query(
        collection(db, 'articles'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const unsubscribeNews = onSnapshot(qNews, (snap) => {
        setLatestNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Article)));
      });

      const qAccess = query(
        collection(db, 'accessRequests'),
        where('patientId', '==', currentUserId),
        where('status', '==', 'pending')
      );
      const unsubscribeAccess = onSnapshot(qAccess, (snap) => {
        setAccessRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Error fetching access requests:", error);
      });

      return () => {
        unsubscribeApp();
        unsubscribeRec();
        unsubscribeNews();
        unsubscribeAccess();
      };
    }

    const qNews = query(
      collection(db, 'articles'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubscribeNews = onSnapshot(qNews, (snap) => {
      setLatestNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Article)));
    });

    return () => {
      unsubscribeApp();
      unsubscribeNews();
    };
  }, [profile, user]);

  return (
    <GuestOverlay
      title="Your Health Dashboard"
      description="Sign in to track your health metrics, manage appointments, and view your medical history in one place."
    >
      <div className="p-8 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-2 neon-text">
              Health Overview
            </h1>
            <p className="text-muted-foreground">Track your metrics and upcoming medical activities.</p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard 
                icon={Activity} 
                label="Health Score" 
                value="92" 
                trend="+2%" 
                colorClass="bg-primary/10 text-primary" 
              />
              <StatCard 
                icon={Calendar} 
                label="Appointments" 
                value={appointments.length} 
                colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400" 
              />
              <StatCard 
                icon={TrendingUp} 
                label="Active Goals" 
                value="4" 
                colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400" 
              />
            </div>

            {/* Daily Health Tip */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-primary/20 to-purple-500/10 p-8 rounded-[2.5rem] border border-primary/20 relative overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Activity className="w-32 h-32 text-primary" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4 max-w-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                      <Heart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">Daily Health Tip</h2>
                      {(tipArticle || healthTipSource) && (
                        <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Sourced from {tipArticle ? tipArticle.category : 'Verified Medical Source'}
                        </span>
                      )}
                    </div>
                  </div>
                  {isTipLoading ? (
                    <div className="space-y-2">
                      <div className="h-5 w-3/4 bg-muted animate-pulse rounded-md"></div>
                      <div className="h-5 w-1/2 bg-muted animate-pulse rounded-md"></div>
                    </div>
                  ) : (
                    <p className="text-lg md:text-xl font-medium text-foreground/95 leading-relaxed italic pr-2">
                      "{healthTip}"
                    </p>
                  )}
                  
                  {/* Source Attribute & Link */}
                  {(healthTipSource || healthTipUrl) && (
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Source:</span>
                      {healthTipUrl ? (
                        <a 
                          href={healthTipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>{healthTipSource || 'Reputable Health Source'}</span>
                        </a>
                      ) : (
                        <span className="font-semibold text-foreground">{healthTipSource}</span>
                      )}
                      {tipArticle && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Topic:</span>
                          <span className="font-semibold text-foreground truncate max-w-[200px]">{tipArticle.title}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {tipArticle && (
                  <div className="shrink-0">
                    <Link 
                      to={`/articles/${tipArticle.id}`}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-2xl hover:bg-neon-blue-dark transition-all shadow-md hover:shadow-lg shadow-primary/25 hover:translate-x-1"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Access Requests List */}
            {profile?.role === 'patient' && accessRequests.length > 0 && (
              <div className="bg-card rounded-3xl border-2 border-primary/20 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-border bg-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                    <h2 className="text-xl font-bold text-foreground">Medical Records Access Requests</h2>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{accessRequests.length} Pending</span>
                </div>
                <div className="divide-y divide-border">
                  {accessRequests.map((req) => (
                    <div key={req.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 hover:bg-primary/10 transition-colors">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                          <Stethoscope className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">Dr. {req.doctorName || 'Specialist'}</h3>
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{req.doctorSpecialization || 'Medical Professional'}</p>
                          <p className="text-sm text-foreground/80 mt-1">
                            Requests consent to securely view your complete medical history and treatment records.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button 
                          onClick={() => handleRejectAccess(req)}
                          className="px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all"
                        >
                          Decline
                        </button>
                        <button 
                          onClick={() => handleApproveAccess(req)}
                          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-neon-blue-dark rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20"
                        >
                          Approve & Share
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appointments List */}
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Upcoming Appointments</h2>
                <Link to="/appointments" className="text-sm font-bold text-primary hover:text-neon-blue-dark">View All</Link>
              </div>
              <div className="divide-y divide-border">
                {appointments.length > 0 ? appointments.map((app) => (
                  <div key={app.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                        <span className="text-xs font-bold uppercase">{safeFormat(app.dateTime, 'MMM')}</span>
                        <span className="text-lg font-bold leading-none">{safeFormat(app.dateTime, 'dd')}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          {profile?.role === 'patient' ? `Dr. ${app.doctorName || 'Specialist'}` : app.patientName || 'Patient'}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {safeFormat(app.dateTime, 'hh:mm a')}</span>
                          <span className="w-1 h-1 bg-border rounded-full"></span>
                          <span className={cn(
                            "capitalize font-bold",
                            app.status === 'accepted' ? 'text-emerald-500' : 
                            app.status === 'rejected' ? 'text-red-500' : 'text-primary'
                          )}>{app.status}</span>
                        </div>
                        {app.doctorNotes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">Note: {app.doctorNotes}</p>
                        )}
                        {app.meetingLink && app.status === 'accepted' && (
                          <Link 
                            to={app.meetingLink.replace(window.location.origin, '')}
                            className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all"
                          >
                            <Sparkles className="w-3 h-3" />
                            Join Video Call
                          </Link>
                        )}
                        <button 
                          onClick={() => {
                            const otherId = profile?.role === 'patient' ? app.doctorId : app.patientId;
                            const roomId = [profile?.uid, otherId].sort().join('_');
                            navigate(`/chat/${roomId}`);
                          }}
                          className="inline-flex items-center gap-2 mt-2 ml-2 px-3 py-1 bg-muted/50 text-muted-foreground rounded-lg text-xs font-bold hover:bg-muted transition-all"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Message
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(app.status === 'pending' || app.status === 'accepted') && profile?.role === 'doctor' && (
                        <>
                          <button 
                            onClick={() => {
                              setSelectedAppointment(app);
                              setDoctorReply(app.doctorNotes || '');
                              setMeetingLink(app.meetingLink || '');
                              setIsReplyModalOpen(true);
                            }}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title={app.status === 'pending' ? "Review Appointment" : "Manage Appointment"}
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button className="p-2 text-muted-foreground hover:text-foreground transition-colors"><ArrowRight className="w-5 h-5" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground">No upcoming appointments</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Emergency Quick Access */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-red-500 p-8 rounded-[2.5rem] shadow-2xl shadow-red-500/30 text-white relative overflow-hidden group border-4 border-white/20"
            >
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                <LifeBuoy className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-tighter">Emergency</h2>
                </div>
                <p className="text-white/90 font-bold mb-6 leading-tight">Need immediate help? Access first aid guides or call emergency services.</p>
                <Link 
                  to="/first-aid" 
                  className="inline-flex items-center justify-center w-full py-4 bg-white text-red-500 rounded-2xl font-black uppercase tracking-tighter hover:bg-red-50 transition-all shadow-lg"
                >
                  First Aid Guide
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </motion.div>

            {/* Health Summary (Patient) */}
            {(!profile || profile.role === 'patient') && (
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6">Health Summary</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5 text-red-500 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Blood Pressure</p>
                        <p className="text-xs text-muted-foreground">Last checked: 2 days ago</p>
                      </div>
                    </div>
                    <p className="font-bold text-foreground">120/80</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Weight</p>
                        <p className="text-xs text-muted-foreground">Goal: 70kg</p>
                      </div>
                    </div>
                    <p className="font-bold text-foreground">74.5 kg</p>
                  </div>
                </div>
                <Link to="/health-tools" className="mt-8 block w-full py-3 text-center text-sm font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
                  Update Metrics
                </Link>
              </div>
            )}

              {/* Recent Records */}
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6">Recent Records</h2>
                <div className="space-y-4">
                  {records.length > 0 ? records.map(rec => (
                    <div key={rec.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground line-clamp-1">{rec.diagnosis}</p>
                        <p className="text-xs text-muted-foreground">{safeFormat(rec.date, 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent records</p>
                  )}
                </div>
                <Link to="/medical-records" className="mt-6 block text-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                  View All Records
                </Link>
              </div>

              {/* Quick Messages */}
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6">Quick Messages</h2>
                <div className="space-y-4">
                  {appointments.slice(0, 3).map(app => {
                    const roomId = [app.patientId, app.doctorId].sort().join('_');
                    const otherName = profile?.role === 'patient' ? `Dr. ${app.doctorName}` : app.patientName;
                    return (
                      <Link 
                        key={app.id} 
                        to={`/chat/${roomId}`}
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-bold text-foreground">{otherName}</p>
                          <p className="text-xs text-muted-foreground">Open chat</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-border" />
                      </Link>
                    );
                  })}
                  {appointments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No active chats</p>
                  )}
                </div>
              </div>

              {/* Health News Card */}
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Global Health News</h2>
                  <Link to="/articles" className="text-xs font-bold text-primary hover:underline">View All</Link>
                </div>
                <div className="space-y-6">
                  {latestNews.length > 0 ? latestNews.slice(0, 3).map((article) => (
                    <Link 
                      key={article.id} 
                      to={`/articles/${article.id}`}
                      className="group block"
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                          <img 
                            src={article.imageURL || 'https://picsum.photos/seed/medical/200/200'} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-bold uppercase tracking-wider">{article.category}</span>
                            <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-1"><Sparkles className="w-2 h-2" /> AI News</span>
                          </div>
                          <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">{article.title}</h3>
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-muted-foreground">
                            <span className="font-semibold text-primary truncate max-w-[120px]">
                              Source: {article.sourceName || article.authorName || 'Verified Registry'}
                            </span>
                            <span>•</span>
                            <span className="line-clamp-1">{article.summary}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No news available yet.</p>
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>

    {/* Appointment Reply Modal */}
      <AnimatePresence>
        {isReplyModalOpen && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-1">Review Appointment</h2>
                    <p className="text-slate-500 dark:text-slate-400">Patient: {selectedAppointment.patientName}</p>
                  </div>
                  <button 
                    onClick={() => setIsReplyModalOpen(false)}
                    className="p-3 bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:text-neon-blue rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Patient's Note</p>
                  <p className="text-sm text-[rgb(var(--foreground))]">{selectedAppointment.notes || "No notes provided."}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {safeFormat(selectedAppointment.dateTime, 'MMM dd, yyyy')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {safeFormat(selectedAppointment.dateTime, 'hh:mm a')}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Your Reply / Instructions</label>
                  <textarea
                    value={doctorReply}
                    onChange={(e) => setDoctorReply(e.target.value)}
                    placeholder="Add instructions, confirmation details, or reason for rejection..."
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))] min-h-[120px] resize-none"
                  />
                </div>

                <div className="space-y-2 mb-8">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Video Meeting Link (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://.../meeting/room-id"
                      className="flex-grow px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
                    />
                    <button 
                      onClick={() => {
                        const roomId = Math.random().toString(36).substring(2, 11);
                        setMeetingLink(`${window.location.origin}/meeting/${roomId}`);
                      }}
                      className="px-4 bg-neon-blue/10 text-neon-blue rounded-2xl hover:bg-neon-blue/20 transition-all font-bold text-xs"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedAppointment.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus('rejected')}
                        disabled={isUpdating}
                        className="py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('accepted')}
                        disabled={isUpdating}
                        className="py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 neon-glow disabled:opacity-50"
                      >
                        {isUpdating ? 'Updating...' : 'Approve'}
                      </button>
                    </>
                  ) : selectedAppointment.status === 'accepted' ? (
                    <button
                      onClick={() => handleUpdateStatus('completed')}
                      disabled={isUpdating}
                      className="col-span-2 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {isUpdating ? 'Updating...' : 'Mark as Completed'}
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </GuestOverlay>
  );
};

export default Dashboard;

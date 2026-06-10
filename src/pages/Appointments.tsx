import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Search,
  Filter,
  ArrowLeft,
  X,
  ChevronRight,
  Video
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Appointment } from '../types';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { createNotification } from '../services/notificationService';
import { safeFormat } from '../lib/dateUtils';

const AppointmentCard = React.memo(({ app, profile, onReview, onChat }: { 
  app: Appointment, 
  profile: any, 
  onReview: (app: Appointment) => void,
  onChat: (app: Appointment) => void
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-muted rounded-3xl flex flex-col items-center justify-center text-muted-foreground border border-border/50">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">{safeFormat(app.dateTime, 'MMM')}</span>
            <span className="text-3xl font-black leading-none">{safeFormat(app.dateTime, 'dd')}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-foreground tracking-tight">
                {profile?.role === 'patient' ? `Dr. ${app.doctorName || 'Specialist'}` : app.patientName || 'Patient'}
              </h3>
              {app.status === 'accepted' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground font-bold">
                <Clock className="w-4 h-4 text-primary" /> {safeFormat(app.dateTime, 'hh:mm a')}
              </span>
              <span className="w-1.5 h-1.5 bg-border rounded-full"></span>
              <span className={cn(
                "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                app.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                app.status === 'completed' ? 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20' :
                'bg-primary/10 text-primary border-primary/20'
              )}>
                {app.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {(app.status === 'pending' || app.status === 'accepted') && profile?.role === 'doctor' && (
              <button 
                onClick={() => onReview(app)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-tighter hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 neon-glow"
              >
                <MessageSquare className="w-5 h-5" />
                {app.status === 'pending' ? 'Review' : 'Manage'}
              </button>
            )}
            {(app.status === 'accepted' || app.status === 'pending') && (
              <button 
                onClick={() => onChat(app)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-muted text-muted-foreground rounded-2xl font-black uppercase tracking-tighter hover:bg-muted/80 transition-all border border-border"
              >
                <MessageSquare className="w-5 h-5" />
                Chat
              </button>
            )}
            {app.meetingLink && app.status === 'accepted' && (
              <a 
                href={app.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-primary/10 text-primary rounded-2xl font-black uppercase tracking-tighter hover:bg-primary/20 transition-all border-2 border-primary/20"
              >
                <Video className="w-5 h-5" />
                Join
              </a>
            )}
          </div>
          {app.doctorNotes && (
            <div className="bg-muted/50 px-4 py-2 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground italic">
                " {app.doctorNotes} "
              </p>
            </div>
          )}
        </div>
      </div>

      {app.notes && (
        <div className="mt-6 pt-6 border-t border-border flex items-start gap-4">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Patient Note</p>
            <p className="text-sm text-foreground/80 font-medium">{app.notes}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
});

const Appointments: React.FC = () => {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [doctorReply, setDoctorReply] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    const qField = profile.role === 'patient' ? 'patientId' : 'doctorId';
    let q = query(
      collection(db, 'appointments'),
      where(qField, '==', profile.uid),
      orderBy('dateTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Appointment)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleUpdateStatus = async (status: 'accepted' | 'rejected' | 'completed') => {
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
      const message = `Dr. ${selectedAppointment.doctorName} has ${status} your appointment for ${safeFormat(selectedAppointment.dateTime, 'MMM dd, yyyy')}.${doctorReply ? ` Note: ${doctorReply}` : ''}${meetingLink ? ` Meeting link: ${meetingLink}` : ''}`;
      
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
  };

  const handleChat = React.useCallback((app: Appointment) => {
    const roomId = [app.patientId, app.doctorId].sort().join('_');
    navigate(`/chat/${roomId}`);
  }, [navigate]);

  const handleReview = React.useCallback((app: Appointment) => {
    setSelectedAppointment(app);
    setIsReplyModalOpen(true);
  }, []);

  const filteredAppointments = React.useMemo(() => {
    return appointments.filter(app => {
      const matchesFilter = filter === 'all' || app.status === filter;
      const otherName = profile?.role === 'patient' ? app.doctorName : app.patientName;
      const matchesSearch = (otherName || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [appointments, filter, searchTerm, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-card text-muted-foreground hover:text-primary rounded-2xl transition-all border border-border"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground neon-text">Appointments</h1>
            <p className="text-muted-foreground">Manage your medical schedule and requests.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all w-full sm:w-64 text-foreground"
            />
          </div>
          <div className="flex bg-card p-1 rounded-2xl border border-border">
            {(['all', 'pending', 'accepted', 'rejected', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize",
                  filter === f 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 gap-8">
        {filteredAppointments.length > 0 ? filteredAppointments.map((app) => (
          <AppointmentCard 
            key={app.id} 
            app={app} 
            profile={profile} 
            onReview={handleReview}
            onChat={handleChat}
          />
        )) : (
          <div className="text-center py-24 bg-card rounded-[3rem] border border-border">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No appointments found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>

      {/* Appointment Reply Modal */}
      <AnimatePresence>
        {isReplyModalOpen && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Review Appointment</h2>
                    <p className="text-muted-foreground">Patient: {selectedAppointment.patientName}</p>
                  </div>
                  <button 
                    onClick={() => setIsReplyModalOpen(false)}
                    className="p-3 bg-muted/50 text-muted-foreground hover:text-primary rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-muted/50 rounded-3xl p-6 mb-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Requested Date & Time</p>
                      <p className="text-sm font-bold text-foreground">
                        {safeFormat(selectedAppointment.dateTime, 'MMMM dd, yyyy')} at {safeFormat(selectedAppointment.dateTime, 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MessageSquare className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient's Note</p>
                      <p className="text-sm text-foreground/70 italic">"{selectedAppointment.notes || 'No notes provided'}"</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Reply / Instructions</label>
                    <textarea
                      value={doctorReply}
                      onChange={(e) => setDoctorReply(e.target.value)}
                      placeholder="Add any instructions or notes for the patient..."
                      className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Meeting Link (Optional)</label>
                    <div className="relative">
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="Zoom, Google Meet, or internal link..."
                        className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    {selectedAppointment.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus('rejected')}
                          disabled={isUpdating}
                          className="flex-grow py-4 bg-destructive/10 text-destructive rounded-2xl font-bold hover:bg-destructive/20 transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('accepted')}
                          disabled={isUpdating}
                          className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 neon-glow disabled:opacity-50"
                        >
                          {isUpdating ? 'Updating...' : 'Accept & Send'}
                        </button>
                      </>
                    ) : selectedAppointment.status === 'accepted' ? (
                      <button
                        onClick={() => handleUpdateStatus('completed')}
                        disabled={isUpdating}
                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {isUpdating ? 'Updating...' : 'Mark as Completed'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Appointments;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Stethoscope, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Calendar, 
  ChevronRight,
  Award,
  Clock,
  MessageSquare,
  CheckCircle2,
  Phone,
  User,
  X,
  Check,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import VoiceSearch from '../components/VoiceSearch';
import GuestOverlay from '../components/GuestOverlay';
import { useSocket } from '../context/SocketContext';

const Doctors: React.FC = () => {
  const { user, profile } = useAuth();
  const { initiateCall } = useSocket();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [bookingDoctor, setBookingDoctor] = useState<UserProfile | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [lastBookedAppointment, setLastBookedAppointment] = useState<any>(null);

  const handleOpenBooking = (doctor: UserProfile) => {
    if (!user || !profile) return navigate('/login');
    setBookingDoctor(doctor);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !bookingDoctor || !bookingDate || !bookingTime) return;
    
    setIsSubmitting(true);
    try {
      const dateTime = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      const appointmentData = {
        patientId: user.uid,
        patientName: profile.fullName,
        doctorId: bookingDoctor.uid,
        doctorName: bookingDoctor.fullName,
        doctorSpecialization: bookingDoctor.specialization,
        hospitalId: bookingDoctor.hospitalId || '',
        hospitalName: bookingDoctor.hospitalName || 'City General Hospital',
        dateTime,
        status: 'pending',
        notes: bookingReason,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'appointments'), appointmentData);
      
      setLastBookedAppointment(appointmentData);
      setIsBookingModalOpen(false);
      setIsConfirmationModalOpen(true);
      
      setBookingDate('');
      setBookingTime('');
      setBookingReason('');
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as UserProfile));
      setDoctors(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const specialties = ['All', ...new Set(doctors.map(d => d.specialization || 'General'))];

  const filteredDoctors = doctors.filter(d => 
    (d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.specialization || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedSpecialty === 'All' || d.specialization === selectedSpecialty)
  );

  const isDoctorActive = (doctor: UserProfile) => {
    if (!doctor.isOnline) return false;
    if (!doctor.lastSeen) return false;
    
    // Check if lastSeen is within the last 5 minutes
    const lastSeenDate = (doctor.lastSeen as any).toDate ? (doctor.lastSeen as any).toDate() : new Date(doctor.lastSeen as any);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeenDate > fiveMinutesAgo;
  };

  const generateGoogleCalendarLink = (appointment: any) => {
    if (!appointment) return '';
    const start = new Date(appointment.dateTime);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 min duration
    
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const title = encodeURIComponent(`Consultation with Dr. ${appointment.doctorName}`);
    const details = encodeURIComponent(`Reason: ${appointment.notes}\nSpecialization: ${appointment.doctorSpecialization}`);
    const location = encodeURIComponent(appointment.hospitalName);
    const dates = `${formatDate(start)}/${formatDate(end)}`;
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  return (
    <GuestOverlay
      title="Access Doctor Directory"
      description="Sign in to connect with top-rated medical specialists, message doctors, and book consultations."
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight neon-text">Doctor Directory</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Connect with top-rated medical specialists and book your consultation online.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-80 flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or specialty..."
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
              />
            </div>
            <VoiceSearch onResult={(text) => setSearchTerm(text)} />
          </div>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-6 py-3 bg-card border border-border rounded-2xl text-muted-foreground font-medium focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
          >
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDoctors.map((doctor, idx) => (
            <motion.div
              key={doctor.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all overflow-hidden group"
            >
              <div className="p-8">
                <div className="flex items-start gap-6 mb-8">
                  <div className="relative">
                    {doctor.photoURL ? (
                      <img 
                        src={doctor.photoURL} 
                        alt={doctor.fullName} 
                        className="w-24 h-24 rounded-3xl object-cover border-4 border-background"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center border-4 border-background">
                        <User className="w-12 h-12 text-primary" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-card rounded-xl flex items-center justify-center border-4 border-background">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        isDoctorActive(doctor) ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30"
                      )} />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground">{doctor.fullName}</h3>
                      {isDoctorActive(doctor) && (
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Online
                        </span>
                      )}
                    </div>
                    <p className="text-primary font-bold text-sm uppercase tracking-wider mb-2">{doctor.specialization}</p>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-bold text-foreground/80">4.9</span>
                      <span className="text-xs text-muted-foreground font-medium">(120+ reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-muted/50 rounded-2xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Award className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Experience</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{doctor.experience || 0}+ Years</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-2xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Available</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">Next: Tomorrow</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground/60" />
                    <span>{doctor.hospitalName || 'City General Hospital'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground/60" />
                    <span>Mon, Wed, Fri</span>
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  <button 
                    onClick={() => {
                      if (!user) return navigate('/login');
                      const roomId = [user.uid, doctor.uid].sort().join('_');
                      navigate(`/chat/${roomId}`);
                    }}
                    className="flex-1 py-3 bg-primary/10 text-primary rounded-2xl font-bold hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Message
                  </button>
                  <button 
                    onClick={() => handleOpenBooking(doctor)}
                    className="flex-[2] py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    Book Appointment
                    <ChevronRight className="w-5 h-5 animate-pulse" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-[2.5rem] border border-border">
          <Stethoscope className="w-16 h-16 text-muted/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Doctors Found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && bookingDoctor && (
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
                    <h2 className="text-2xl font-bold text-foreground mb-1">Book Appointment</h2>
                    <p className="text-muted-foreground">With Dr. {bookingDoctor.fullName}</p>
                  </div>
                  <button 
                    onClick={() => setIsBookingModalOpen(false)}
                    className="p-3 bg-muted/50 text-muted-foreground hover:text-primary rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleConfirmBooking} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Time Slot</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                        <select
                          required
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground appearance-none"
                        >
                          <option value="">Select Time</option>
                          {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Reason for Visit</label>
                    <textarea
                      required
                      value={bookingReason}
                      onChange={(e) => setBookingReason(e.target.value)}
                      placeholder="Briefly describe your symptoms or reason for the visit..."
                      className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground min-h-[120px] resize-none"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(false)}
                      className="flex-grow py-4 bg-muted/50 text-muted-foreground rounded-2xl font-bold hover:bg-muted transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow disabled:opacity-50"
                    >
                      {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmationModalOpen && lastBookedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-emerald-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
                <p className="text-muted-foreground mb-8">
                  Your appointment request has been sent to Dr. {lastBookedAppointment.doctorName}.
                </p>

                <div className="bg-muted/50 rounded-3xl p-6 mb-8 text-left space-y-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Date & Time</p>
                      <p className="text-sm font-bold text-foreground">
                        {format(new Date(lastBookedAppointment.dateTime), 'MMMM dd, yyyy')} at {format(new Date(lastBookedAppointment.dateTime), 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Location</p>
                      <p className="text-sm font-bold text-foreground">{lastBookedAppointment.hospitalName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href={generateGoogleCalendarLink(lastBookedAppointment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-card border border-border text-foreground rounded-2xl font-bold hover:border-primary transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Add to Google Calendar
                  </a>
                  <button
                    onClick={() => setIsConfirmationModalOpen(false)}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </GuestOverlay>
  );
};

export default Doctors;

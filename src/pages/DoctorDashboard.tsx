import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Stethoscope, 
  Pill, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Hospital, 
  BookOpen, 
  Settings, 
  Bell,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronRight,
  Mic,
  Download,
  Filter,
  MoreVertical,
  User,
  Heart,
  Star,
  TrendingDown,
  Eye,
  Printer,
  Send,
  Save,
  History,
  AlertCircle,
  ArrowRight,
  X,
  Video,
  Sparkles,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Appointment, MedicalRecord, UserProfile, Article } from '../types';
import { format } from 'date-fns';
import { checkAndTriggerAutoNews } from '../services/newsSchedulerService';
import { safeFormat } from '../lib/dateUtils';
import { useSocket } from '../context/SocketContext';
import { downloadPrescriptionPDF } from '../components/PrescriptionPDF';

// Tab Components
const OverviewTab = ({ 
  appointments, 
  stats, 
  onStartMeeting,
  navigate,
  profile,
  setSelectedAppointment,
  setIsReplyModalOpen,
  onViewCalendar
}: { 
  appointments: Appointment[], 
  stats: any, 
  onStartMeeting: () => void,
  navigate: any,
  profile: any,
  setSelectedAppointment: (app: any) => void,
  setIsReplyModalOpen: (open: boolean) => void,
  onViewCalendar: () => void
}) => {
  return (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Today's Appointments</p>
        <p className="text-2xl font-bold text-foreground">{stats.todayAppointments}</p>
      </div>
      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Total Patients</p>
        <p className="text-2xl font-bold text-foreground">{stats.totalPatients}</p>
      </div>
      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
          <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Consultations</p>
        <p className="text-2xl font-bold text-foreground">{stats.totalConsultations}</p>
      </div>
      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
          <Bell className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Pending Requests</p>
        <p className="text-2xl font-bold text-foreground">{stats.pendingRequests}</p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Upcoming Schedule</h2>
            <button 
              onClick={onViewCalendar}
              className="text-sm font-bold text-primary hover:underline"
            >
              View Calendar
            </button>
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
                    <h3 className="font-bold text-foreground">{app.patientName}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {safeFormat(app.dateTime, 'hh:mm a')}</span>
                      <span className="w-1 h-1 bg-border rounded-full"></span>
                      <span className="capitalize">{app.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate(`/chat/${[profile?.uid, app.patientId].sort().join('_')}`)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedAppointment(app);
                      setIsReplyModalOpen(true);
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-muted-foreground">No upcoming appointments</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <button className="flex items-center gap-3 p-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl font-bold hover:bg-purple-500/20 transition-all text-left">
              <Pill className="w-5 h-5" />
              <span>Add Prescription</span>
            </button>
            <button className="flex items-center gap-3 p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl font-bold hover:bg-emerald-500/20 transition-all text-left">
              <Plus className="w-5 h-5" />
              <span>New Health Article</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

const AppointmentsTab: React.FC<{ 
  appointments: any[], 
  onUpdateStatus: (appointment: any) => void 
}> = ({ appointments, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = appointments.filter(app => {
    const matchesSearch = app.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Manage Appointments</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{app.patientName}</p>
                        <p className="text-xs text-muted-foreground">{app.notes?.substring(0, 30)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-foreground">
                      {safeFormat(app.dateTime, 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {safeFormat(app.dateTime, 'hh:mm a')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      app.status === 'accepted' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                      app.status === 'pending' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                      app.status === 'completed' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                      "bg-destructive/10 text-destructive"
                    )}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onUpdateStatus(app)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="Review Appointment"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PatientsTab = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States for viewing patient history
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState<UserProfile | null>(null);
  const [patientHistoryRecords, setPatientHistoryRecords] = useState<MedicalRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'patient'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching patients:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUserId = user?.uid || profile?.uid;
    if (!currentUserId) return;
    const q = query(
      collection(db, 'accessRequests'),
      where('doctorId', '==', currentUserId)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setAccessRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching access requests:", error);
    });
    return () => unsubscribe();
  }, [profile, user]);

  useEffect(() => {
    if (!selectedHistoryPatient) {
      setPatientHistoryRecords([]);
      return;
    }
    setLoadingHistory(true);
    // Query medical records for this patient
    const q = query(
      collection(db, 'medicalRecords'),
      where('patientId', '==', selectedHistoryPatient.uid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const recordsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MedicalRecord));
      // Sort client-side to prevent Composite Index creation blockages in Firestore
      recordsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPatientHistoryRecords(recordsData);
      setLoadingHistory(false);
    }, (error) => {
      console.error("Error fetching patient history:", error);
      setLoadingHistory(false);
    });
    return () => unsubscribe();
  }, [selectedHistoryPatient]);

  const handleRequestAccess = async (patient: UserProfile) => {
    if (!profile) return;
    const reqId = `${patient.uid}_${profile.uid}`;
    try {
      await setDoc(doc(db, 'accessRequests', reqId), {
        id: reqId,
        patientId: patient.uid,
        patientName: patient.fullName,
        doctorId: profile.uid,
        doctorName: profile.fullName,
        doctorSpecialization: profile.specialization || 'Specialist',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Create a patient notification
      await addDoc(collection(db, 'notifications'), {
        userId: patient.uid,
        title: "Medical Records Access Request",
        message: `Dr. ${profile.fullName} is requesting access to view your medical records history.`,
        type: 'alert',
        read: false,
        createdAt: serverTimestamp()
      });

      alert(`Access request successfully sent to ${patient.fullName}. They will receive an action prompt on their dashboard.`);
    } catch (e) {
      console.error("Error sending access request:", e);
      alert("Failed to send access request. Please try again.");
    }
  };

  const filteredPatients = patients.filter(p => p.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search patients by name, ID, or condition..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-grow sm:flex-grow-0 px-6 py-3 bg-muted text-foreground rounded-2xl font-bold flex items-center justify-center gap-2">
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => {
          const req = accessRequests.find(r => r.patientId === patient.uid);
          const accessStatus = req ? req.status : 'none';

          return (
            <div key={patient.uid} className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4 mb-6">
                {patient.photoURL ? (
                  <img src={patient.photoURL} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-foreground">{patient.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{patient.age || 'N/A'} years • {patient.gender || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-bold text-foreground">{patient.city || 'Not Specified'}</span>
                </div>
                
                {/* Access Request Status Status Details */}
                <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Records Consent</span>
                  {accessStatus === 'approved' && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Shared
                    </span>
                  )}
                  {accessStatus === 'pending' && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-xs font-bold flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                  {accessStatus === 'rejected' && (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded text-xs font-bold flex items-center gap-1 animate-pulse">
                      <XCircle className="w-3 h-3" /> Denied
                    </span>
                  )}
                  {accessStatus === 'none' && (
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs font-bold">
                      No Access
                    </span>
                  )}
                </div>
              </div>

              {/* Action grid */}
              <div className="space-y-2">
                <button 
                  onClick={() => navigate(`/chat/${[profile?.uid, patient.uid].sort().join('_')}`)}
                  className="w-full py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-3 h-3" />
                  Message Patient
                </button>

                {/* Consent/History View Actions */}
                {accessStatus === 'approved' && (
                  <button 
                    onClick={() => setSelectedHistoryPatient(patient)}
                    className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-3 h-3" />
                    View General History
                  </button>
                )}

                {(accessStatus === 'none' || accessStatus === 'rejected') && (
                  <button 
                    onClick={() => handleRequestAccess(patient)}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Stethoscope className="w-3 h-3" />
                    Request Records Access
                  </button>
                )}

                {accessStatus === 'pending' && (
                  <button 
                    disabled
                    className="w-full py-2.5 bg-amber-500/10 text-amber-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Clock className="w-3 h-3" />
                    Awaiting Patient Consent
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Patient History Viewer Modal */}
      <AnimatePresence>
        {selectedHistoryPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Medical History Log</h2>
                  <p className="text-xs text-muted-foreground">Patient: {selectedHistoryPatient.fullName}</p>
                </div>
                <button 
                  onClick={() => setSelectedHistoryPatient(null)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-grow space-y-6">
                {loadingHistory ? (
                  <div className="space-y-4 py-8">
                    <div className="h-4 w-1/3 bg-muted animate-pulse rounded-md mx-auto"></div>
                    <div className="h-24 w-full bg-muted animate-pulse rounded-2xl animate-pulse"></div>
                    <div className="h-24 w-full bg-muted animate-pulse rounded-2xl animate-pulse"></div>
                  </div>
                ) : (
                  <>
                    {patientHistoryRecords.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="font-medium">No previous records available</p>
                        <p className="text-xs">No diagnostic entries or prescriptions have been submitted for this patient yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {patientHistoryRecords.map((rec) => (
                          <div key={rec.id} className="p-5 border border-border/80 bg-background rounded-2xl space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase">
                                  {rec.diagnosis === 'Prescription Issued' ? 'Prescription' : 'Consultation'}
                                </span>
                                <h4 className="font-bold text-foreground text-md mt-1">{rec.diagnosis}</h4>
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">
                                {rec.date ? format(new Date(rec.date), 'MMM dd, yyyy') : 'No date'}
                              </span>
                            </div>
                            
                            <div className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed py-1">
                              {rec.notes || rec.prescription}
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                              <span className="font-bold">Issued By:</span>
                              <span>Dr. {rec.doctorName || 'Medical Professional'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
                <button 
                  onClick={() => setSelectedHistoryPatient(null)}
                  className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-all"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ConsultationsTab = () => {
  const { profile } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [formData, setFormData] = useState({
    symptoms: '',
    diagnosis: '',
    treatment: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'patient'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    });
    return () => unsubscribe();
  }, []);

  const selectedPatient = patients.find(p => p.uid === selectedPatientId);

  const handleCompleteSession = async () => {
    if (!selectedPatientId || !formData.diagnosis) {
      alert("Please select a patient and enter a diagnosis.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'medicalRecords'), {
        patientId: selectedPatientId,
        doctorId: profile?.uid,
        doctorName: profile?.fullName,
        date: new Date().toISOString(),
        diagnosis: formData.diagnosis,
        notes: `Symptoms: ${formData.symptoms}\nTreatment: ${formData.treatment}`,
        createdAt: serverTimestamp()
      });
      alert("Consultation session completed and saved!");
      setFormData({ symptoms: '', diagnosis: '', treatment: '' });
      setSelectedPatientId('');
    } catch (error) {
      console.error("Error saving consultation:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-foreground">Active Consultation</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Session
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Select Patient</label>
              <select 
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-4 bg-muted/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Choose a patient...</option>
                {patients.map(p => (
                  <option key={p.uid} value={p.uid}>{p.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Symptoms & Observations</label>
              <div className="relative">
                <textarea 
                  value={formData.symptoms}
                  onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                  className="w-full p-4 bg-muted/50 border border-border rounded-2xl min-h-[120px] outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Type or use voice to record symptoms..."
                ></textarea>
                <button 
                  onClick={() => setIsRecording(!isRecording)}
                  className={cn(
                    "absolute bottom-4 right-4 p-3 rounded-xl transition-all",
                    isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Diagnosis</label>
                <input 
                  type="text" 
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  className="w-full p-4 bg-muted/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                  placeholder="Enter diagnosis..." 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Treatment Plan</label>
                <input 
                  type="text" 
                  value={formData.treatment}
                  onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                  className="w-full p-4 bg-muted/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                  placeholder="Enter treatment..." 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border flex justify-end gap-3">
              <button className="px-8 py-3 bg-muted text-foreground rounded-2xl font-bold hover:bg-muted/80 transition-all">Save Draft</button>
              <button 
                onClick={handleCompleteSession}
                disabled={loading}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Complete Session'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-6">Patient Info</h2>
          {selectedPatient ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                {selectedPatient.photoURL ? (
                  <img src={selectedPatient.photoURL} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-foreground">{selectedPatient.fullName}</h3>
                  <p className="text-sm text-muted-foreground">ID: #{selectedPatient.uid.substring(0, 8)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-2xl">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Critical Conditions</p>
                  <p className="text-sm font-bold text-destructive">{selectedPatient.conditions || 'None reported'}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-2xl">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Allergies</p>
                  <p className="text-sm font-bold text-foreground">{selectedPatient.allergies || 'None reported'}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-muted-foreground text-sm">Select a patient to view details</div>
          )}
        </div>
      </div>
    </div>
  );
};

const PrescriptionsTab = () => {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'patient'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    });
    return () => unsubscribe();
  }, []);

  const handleSendPrescription = async () => {
    if (!formData.patientId || !formData.medicationName) {
      alert("Please select a patient and medication.");
      return;
    }
    setLoading(true);
    try {
      const patient = patients.find(p => p.uid === formData.patientId);
      await addDoc(collection(db, 'medicalRecords'), {
        patientId: formData.patientId,
        doctorId: profile?.uid,
        doctorName: profile?.fullName,
        date: new Date().toISOString(),
        diagnosis: 'Prescription Issued',
        prescription: `${formData.medicationName} - ${formData.dosage} (${formData.frequency}) for ${formData.duration}. ${formData.instructions}`,
        createdAt: serverTimestamp()
      });
      alert("Prescription sent successfully!");
      setFormData({
        patientId: '',
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    } catch (error) {
      console.error("Error sending prescription:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-foreground">New Digital Prescription</h2>
          <button className="px-6 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary/20 transition-all">
            Load Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Patient</label>
              <select 
                value={formData.patientId}
                onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                className="w-full p-4 bg-muted/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Select Patient...</option>
                {patients.map(p => (
                  <option key={p.uid} value={p.uid}>{p.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Medication Name</label>
              <input 
                type="text" 
                value={formData.medicationName}
                onChange={(e) => setFormData({...formData, medicationName: e.target.value})}
                className="w-full p-4 bg-muted/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                placeholder="e.g. Amoxicillin" 
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Dosage</label>
                <input 
                  type="text" 
                  value={formData.dosage}
                  onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                  className="w-full p-4 bg-muted/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                  placeholder="e.g. 500mg" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Frequency</label>
                <input 
                  type="text" 
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  className="w-full p-4 bg-muted/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                  placeholder="e.g. Twice daily" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Duration</label>
              <input 
                type="text" 
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full p-4 bg-muted/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                placeholder="e.g. 7 days" 
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Additional Instructions</label>
          <textarea 
            value={formData.instructions}
            onChange={(e) => setFormData({...formData, instructions: e.target.value})}
            className="w-full p-4 bg-muted/50 border border-border rounded-2xl min-h-[100px] outline-none focus:ring-2 focus:ring-primary transition-all" 
            placeholder="Take after meals..."
          ></textarea>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => {
              if (!formData.patientId || !formData.medicationName) {
                alert("Please select a patient and enter a medication name first to generate a printable PDF draft.");
                return;
              }
              const selectedPatient = patients.find(p => p.uid === formData.patientId);
              const prescriptionText = `${formData.medicationName} - ${formData.dosage} (${formData.frequency}) for ${formData.duration}. ${formData.instructions}`;
              
              downloadPrescriptionPDF({
                record: {
                  id: 'DRAFT',
                  patientId: formData.patientId,
                  doctorId: profile?.uid || 'doctor',
                  date: new Date().toISOString(),
                  diagnosis: 'Prescription Issued (Draft)',
                  prescription: prescriptionText,
                  doctorName: profile?.fullName || 'Licensed Specialist'
                },
                patientName: selectedPatient?.fullName || 'Patient',
                patientAge: selectedPatient?.age,
                patientGender: selectedPatient?.gender
              });
            }}
            className="px-8 py-3 bg-muted text-foreground rounded-2xl font-bold hover:bg-muted/80 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            Print PDF
          </button>
          <button 
            onClick={handleSendPrescription}
            disabled={loading}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Sending...' : (
              <>
                <Pill className="w-5 h-5" />
                Send Digital Prescription
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const MedicalRecordsTab = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'medicalRecords'),
      where('doctorId', '==', profile.uid),
      orderBy('date', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MedicalRecord)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching medical records:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);

  const filteredRecords = records.filter(r => 
    r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-foreground">Patient Health Timeline</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search records..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm outline-none" 
              />
            </div>
            <button className="p-2 bg-muted/50 border border-border rounded-xl text-muted-foreground"><Filter className="w-4 h-4" /></button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading records...</div>
        ) : (
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {filteredRecords.length > 0 ? filteredRecords.map((record) => (
              <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-muted text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[45%] bg-card p-6 rounded-3xl border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <time className="text-xs font-bold text-primary uppercase">{safeFormat(record.date, 'MMMM dd, yyyy')}</time>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider">Record</span>
                  </div>
                  <h4 className="font-bold text-foreground mb-1">{record.diagnosis}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {record.prescription || record.notes || 'No additional details provided.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button className="text-xs font-bold text-primary hover:underline">View Details</button>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">Dr. {record.doctorName}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-muted-foreground">No medical records found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MessagesTab = () => {
  const { profile } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;
    
    // Fetch appointments to get patient list for chats
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', profile.uid),
      orderBy('dateTime', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const uniquePatients = new Map();
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (!uniquePatients.has(data.patientId)) {
          uniquePatients.set(data.patientId, {
            patientId: data.patientId,
            patientName: data.patientName,
            roomId: [data.patientId, profile.uid].sort().join('_')
          });
        }
      });
      setChats(Array.from(uniquePatients.values()));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching patient chats from appointments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  return (
    <div className="bg-card rounded-[3rem] border border-border shadow-sm overflow-hidden flex h-[600px]">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search chats..." className="w-full pl-10 pr-4 py-2 bg-muted/50 border-transparent rounded-xl text-sm outline-none" />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto divide-y divide-border">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground text-sm">Loading chats...</div>
          ) : chats.length > 0 ? chats.map((chat) => (
            <button 
              key={chat.roomId} 
              onClick={() => navigate(`/chat/${chat.roomId}`)}
              className="w-full p-6 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-foreground truncate">{chat.patientName}</h4>
                </div>
                <p className="text-xs text-muted-foreground truncate">Click to open consultation chat</p>
              </div>
            </button>
          )) : (
            <div className="p-10 text-center text-muted-foreground text-sm">No active chats found.</div>
          )}
        </div>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-medium">Select a chat to start messaging</p>
      </div>
    </div>
  );
};

const AnalyticsTab = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Patient Growth</h3>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-4xl font-bold text-foreground mb-2">+24%</p>
          <p className="text-sm text-muted-foreground">Increase from last month</p>
        </div>
        <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Avg. Consultation</h3>
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-4xl font-bold text-foreground mb-2">18m</p>
          <p className="text-sm text-muted-foreground">Per patient session</p>
        </div>
        <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Satisfaction</h3>
            <Heart className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-4xl font-bold text-foreground mb-2">4.9</p>
          <p className="text-sm text-muted-foreground">Based on 120 reviews</p>
        </div>
      </div>

      <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-8">Monthly Performance</h2>
        <div className="h-64 flex items-end justify-between gap-4">
          {[40, 60, 45, 90, 65, 80, 55, 70, 85, 95, 75, 100].map((h, i) => (
            <div key={i} className="flex-grow flex flex-col items-center gap-2">
              <div className="w-full bg-primary/20 rounded-t-xl relative group">
                <div 
                  className="w-full bg-primary rounded-t-xl transition-all duration-500 group-hover:bg-primary/80" 
                  style={{ height: `${h}%` }}
                ></div>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {h}%
                </div>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WorkplaceTab = () => {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize form state
  const [formData, setFormData] = useState({
    hospitalName: '',
    description: '',
    beds: '',
    specialists: '',
    department: '',
    floor: '',
    room: '',
    workingHoursWeekday: '',
    workingHoursSaturday: ''
  });

  useEffect(() => {
    if (profile) {
      const wp = profile.workplace || {};
      setFormData({
        hospitalName: wp.hospitalName || profile.hospitalName || "City General Hospital",
        description: wp.description || "A leading healthcare institution providing world-class medical services with state-of-the-art facilities and a dedicated team of specialists.",
        beds: wp.beds || "500+ Beds",
        specialists: wp.specialists || "200+ Specialists",
        department: wp.department || "Cardiology",
        floor: wp.floor || "4th Floor, Wing B",
        room: wp.room || "Consultation Room 402",
        workingHoursWeekday: wp.workingHoursWeekday || "09:00 AM - 05:00 PM",
        workingHoursSaturday: wp.workingHoursSaturday || "09:00 AM - 01:00 PM"
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        workplace: formData,
        hospitalName: formData.hospitalName
      });
      setFeedback({ type: 'success', message: 'Workplace information updated successfully!' });
      setIsEditing(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error("Failed to save workplace information:", err);
      setFeedback({ type: 'error', message: err.message || 'Failed to update workplace.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 border shadow-sm max-w-4xl",
          feedback.type === 'success' 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
            : "bg-destructive/10 border-destructive/20 text-destructive"
        )}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="font-bold text-sm">{feedback.message}</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-card p-10 rounded-[3rem] border border-border shadow-sm max-w-4xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Edit Workplace Details</h2>
              <p className="text-sm text-muted-foreground mt-1">Specify your current medical work center setup.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-3 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-foreground" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Hospital/Workplace Name</label>
              <input
                type="text"
                required
                value={formData.hospitalName}
                onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                placeholder="e.g. City General Hospital"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Description</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary transition-all font-medium resize-none"
                placeholder="Hospital bio or specialized facilities info..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Beds Capacity</label>
                <input
                  type="text"
                  required
                  value={formData.beds}
                  onChange={(e) => handleInputChange('beds', e.target.value)}
                  className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                  placeholder="e.g. 500+ Beds"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Specialists Count</label>
                <input
                  type="text"
                  required
                  value={formData.specialists}
                  onChange={(e) => handleInputChange('specialists', e.target.value)}
                  className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                  placeholder="e.g. 200+ Specialists"
                />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Location & Department</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                    placeholder="e.g. Cardiology"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Floor info</label>
                  <input
                    type="text"
                    required
                    value={formData.floor}
                    onChange={(e) => handleInputChange('floor', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                    placeholder="e.g. 4th Floor, Wing B"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Room</label>
                  <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) => handleInputChange('room', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                    placeholder="e.g. Consultation Room 402"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Consultation Shift Schedule</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Weekday Hours (Mon-Fri)</label>
                  <input
                    type="text"
                    required
                    value={formData.workingHoursWeekday}
                    onChange={(e) => handleInputChange('workingHoursWeekday', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                    placeholder="e.g. 09:00 AM - 05:00 PM"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Saturday Hours</label>
                  <input
                    type="text"
                    required
                    value={formData.workingHoursSaturday}
                    onChange={(e) => handleInputChange('workingHoursSaturday', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                    placeholder="e.g. 09:00 AM - 01:00 PM"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 border border-border bg-transparent text-foreground hover:bg-muted rounded-2xl font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 bg-primary text-primary-foreground hover:opacity-90 rounded-2xl font-bold transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="bg-card p-10 rounded-[3rem] border border-border shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-background border border-border hover:bg-muted text-foreground font-bold rounded-2xl transition-all shadow-sm"
              >
                <Edit className="w-4 h-4 text-primary" />
                <span>Edit Workplace</span>
              </button>
            </div>

            <div className="relative flex flex-col md:flex-row gap-10 items-center">
              <div className="w-48 h-48 bg-muted rounded-[2.5rem] flex items-center justify-center shrink-0 border-4 border-background shadow-xl">
                <Hospital className="w-20 h-20 text-primary" />
              </div>
              <div className="flex-grow text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">Primary Workplace</span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">Verified</span>
                </div>
                <h2 className="text-4xl font-bold text-foreground mb-4">{formData.hospitalName}</h2>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl leading-relaxed">
                  {formData.description}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                  <div className="flex items-center gap-2 text-foreground/80">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span className="font-bold">{formData.beds}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/80">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-bold">{formData.specialists}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-6">Department Info</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
                  <span className="text-muted-foreground font-medium">Department</span>
                  <span className="font-bold text-foreground">{formData.department}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
                  <span className="text-muted-foreground font-medium">Floor</span>
                  <span className="font-bold text-foreground">{formData.floor}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
                  <span className="text-muted-foreground font-medium">Room</span>
                  <span className="font-bold text-foreground">{formData.room}</span>
                </div>
              </div>
            </div>
            <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-6">Working Hours</h3>
              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{day}</span>
                    <span className="font-bold text-foreground">{formData.workingHoursWeekday}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Saturday</span>
                  <span className="font-bold text-amber-500">{formData.workingHoursSaturday}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ArticlesTab = () => {
  const { profile } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [globalNews, setGlobalNews] = useState<Article[]>([]);
  const [view, setView] = useState<'my' | 'global'>('global');

  useEffect(() => {
    if (!profile) return;
    
    // My articles
    const qMy = query(
      collection(db, 'articles'),
      where('authorId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeMy = onSnapshot(qMy, (snap) => {
      setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Article)));
    });

    // Global news (AI generated)
    const qGlobal = query(
      collection(db, 'articles'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubscribeGlobal = onSnapshot(qGlobal, (snap) => {
      setGlobalNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Article)));
    });

    return () => {
      unsubscribeMy();
      unsubscribeGlobal();
    };
  }, [profile]);

  const displayArticles = view === 'my' ? articles : globalNews;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl w-fit">
          <button 
            onClick={() => setView('global')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              view === 'global' ? "bg-white dark:bg-slate-800 text-neon-blue shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            Global Health News
          </button>
          <button 
            onClick={() => setView('my')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              view === 'my' ? "bg-white dark:bg-slate-800 text-neon-blue shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            My Articles
          </button>
        </div>
        {view === 'my' && (
          <Link to="/articles/create" className="px-6 py-2 bg-neon-blue text-slate-900 rounded-xl font-bold hover:bg-neon-blue-dark transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Write Article
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayArticles.length > 0 ? displayArticles.map((article) => (
          <div key={article.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col sm:flex-row group">
            <div className="w-full sm:w-48 h-48 shrink-0 overflow-hidden">
              <img src={article.imageURL || 'https://picsum.photos/seed/medical/400/400'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
            </div>
            <div className="p-6 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-neon-blue/10 text-neon-blue rounded text-[10px] font-bold uppercase tracking-wider">{article.category}</span>
                  {view === 'global' && <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-1"><Sparkles className="w-2 h-2" /> AI News</span>}
                </div>
                <h3 className="font-bold text-[rgb(var(--foreground))] mt-2 line-clamp-2 group-hover:text-neon-blue transition-colors">{article.title}</h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{article.summary}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.authorName}</span>
                  <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {safeFormat(article.createdAt, 'MMM dd')}</span>
                </div>
                <div className="flex gap-2">
                  {view === 'my' && <Link to={`/articles/${article.id}/edit`} className="p-2 text-slate-400 hover:text-neon-blue transition-colors"><Settings className="w-4 h-4" /></Link>}
                  <Link to={`/articles/${article.id}`} className="p-2 text-slate-400 hover:text-neon-blue transition-colors"><ChevronRight className="w-4 h-4" /></Link>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">No articles found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsTab = ({ profile }: { profile: UserProfile }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-bold text-[rgb(var(--foreground))] mb-8">Professional Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Full Name</label>
              <input type="text" defaultValue={profile.fullName} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-neon-blue transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Specialization</label>
              <input type="text" defaultValue={profile.specialization} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-neon-blue transition-all" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">License Number</label>
              <input type="text" defaultValue={profile.licenseNumber} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-neon-blue transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Experience (Years)</label>
              <input type="number" defaultValue={profile.experience} className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-neon-blue transition-all" />
            </div>
          </div>
        </div>
        <div className="mt-8">
          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Professional Bio</label>
          <textarea className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl min-h-[120px] outline-none focus:ring-2 focus:ring-neon-blue transition-all" placeholder="Tell patients about your expertise..."></textarea>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button className="px-8 py-3 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [naggingAppointments, setNaggingAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    totalConsultations: 0,
    pendingRequests: 0
  });

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [doctorReply, setDoctorReply] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async (appointmentId: string, newStatus: 'accepted' | 'rejected' | 'completed') => {
    setIsUpdating(true);
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const updateData: any = { 
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      if (doctorReply) updateData.doctorNotes = doctorReply;
      if (meetingLink) updateData.meetingLink = meetingLink;

      await updateDoc(appointmentRef, updateData);

      // Create notification for patient
      if (selectedAppointment) {
        await addDoc(collection(db, 'notifications'), {
          userId: selectedAppointment.patientId,
          title: `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          message: `Dr. ${profile?.fullName} has ${newStatus} your appointment request for ${safeFormat(selectedAppointment.dateTime, 'MMM dd, hh:mm a')}.`,
          type: 'appointment',
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setIsReplyModalOpen(false);
      setDoctorReply('');
      setMeetingLink('');
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert('Failed to update appointment status.');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!profile || profile.role !== 'doctor') return;

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', profile.uid),
      orderBy('dateTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const apps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Appointment));
      setAppointments(apps.slice(0, 20)); // Keep only recent for the list
      
      // Calculate accurate stats
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const uniquePatients = new Set(apps.map(a => a.patientId)).size;
      const completedConsultations = apps.filter(a => a.status === 'completed').length;
      const pending = apps.filter(a => a.status === 'pending');
      
      setStats({
        todayAppointments: apps.filter(a => a.dateTime.startsWith(today)).length,
        totalPatients: uniquePatients,
        totalConsultations: completedConsultations,
        pendingRequests: pending.length
      });

      // Nagging notifications: Pending appointments within 24 hours
      const nagging = pending.filter(a => {
        const appDate = new Date(a.dateTime);
        const diffHours = (appDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 24;
      });
      setNaggingAppointments(nagging);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleStartMeeting = () => {
    const randomId = Math.random().toString(36).substring(2, 12);
    const link = `${window.location.origin}/meeting/${randomId}?type=video`;
    setMeetingLink(link);
    setShowMeetingModal(true);
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingLink);
    alert("Meeting link copied to clipboard!");
  };

  if (profile?.role !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-slate-500">This area is reserved for medical professionals.</p>
          <Link to="/dashboard" className="mt-6 inline-block text-neon-blue font-bold">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full text-center space-y-8 p-12 bg-card rounded-[3rem] border border-border shadow-2xl">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Approval Pending</h2>
          <p className="text-muted-foreground text-lg">
            Your medical professional account is currently being reviewed by our administration team. 
            This usually takes 24-48 hours.
          </p>
          <div className="pt-6">
            <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all inline-block">
              Go to Patient Dashboard
            </Link>
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            We will notify you via email once your account has been verified.
          </p>
        </div>
      </div>
    );
  }

  if (profile?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full text-center space-y-8 p-12 bg-card rounded-[3rem] border border-border shadow-2xl">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Application Rejected</h2>
          <p className="text-muted-foreground text-lg">
            Unfortunately, your application for a medical professional account was not approved at this time.
          </p>
          <div className="pt-6">
            <Link to="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all inline-block">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return (
        <OverviewTab 
          appointments={appointments} 
          stats={stats} 
          onStartMeeting={handleStartMeeting}
          navigate={navigate}
          profile={profile}
          setSelectedAppointment={setSelectedAppointment}
          setIsReplyModalOpen={setIsReplyModalOpen}
          onViewCalendar={() => setSearchParams({ tab: 'appointments' })}
        />
      );
      case 'appointments': return (
        <AppointmentsTab 
          appointments={appointments} 
          onUpdateStatus={(appointment) => {
            setSelectedAppointment(appointment);
            setIsReplyModalOpen(true);
          }} 
        />
      );
      case 'patients': return <PatientsTab />;
      case 'consultations': return <ConsultationsTab />;
      case 'prescriptions': return <PrescriptionsTab />;
      case 'medical-records': return <MedicalRecordsTab />;
      case 'messages': return <MessagesTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'workplace': return <WorkplaceTab />;
      case 'articles': return <ArticlesTab />;
      case 'settings': return <SettingsTab profile={profile} />;
      default: return (
        <OverviewTab 
          appointments={appointments} 
          stats={stats} 
          onStartMeeting={handleStartMeeting}
          navigate={navigate}
          profile={profile}
          setSelectedAppointment={setSelectedAppointment}
          setIsReplyModalOpen={setIsReplyModalOpen}
          onViewCalendar={() => setSearchParams({ tab: 'appointments' })}
        />
      );
    }
  };

  return (
    <div className="p-8 flex-grow">
      <div className="max-w-6xl mx-auto">
        {/* Nagging Notifications Banner */}
        {naggingAppointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center gap-6"
          >
            <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400">Urgent: Pending Appointments</h3>
              <p className="text-rose-600/80 dark:text-rose-400/80 font-medium">
                You have {naggingAppointments.length} appointment{naggingAppointments.length > 1 ? 's' : ''} starting within 24 hours that still need your response.
              </p>
            </div>
            <button 
              onClick={() => setSearchParams({ tab: 'appointments' })}
              className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
            >
              Review Now
            </button>
          </motion.div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[rgb(var(--foreground))] capitalize">{activeTab.replace('-', ' ')}</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your professional workspace and patient care.</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
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

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 mb-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-neon-blue" />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Requested Date & Time</p>
                      <p className="text-sm font-bold text-[rgb(var(--foreground))]">
                        {safeFormat(selectedAppointment.dateTime, 'MMMM dd, yyyy')} at {safeFormat(selectedAppointment.dateTime, 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MessageSquare className="w-5 h-5 text-neon-blue mt-1" />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient's Note</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{selectedAppointment.notes || 'No notes provided'}"</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Your Reply / Instructions</label>
                    <textarea
                      value={doctorReply}
                      onChange={(e) => setDoctorReply(e.target.value)}
                      placeholder="Add any instructions or notes for the patient..."
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))] min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Meeting Link (Optional)</label>
                    <div className="relative">
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="Zoom, Google Meet, or internal link..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'rejected')}
                      disabled={isUpdating}
                      className="flex-grow py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'accepted')}
                      disabled={isUpdating}
                      className="flex-[2] py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 neon-glow disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Accept & Send'}
                    </button>
                  </div>
                  
                  {selectedAppointment.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}
                      disabled={isUpdating}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Meeting Link Modal */}
      <AnimatePresence>
        {showMeetingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">New Meeting Link</h3>
                <button onClick={() => setShowMeetingModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Share this link with your patient to start a secure video consultation.
              </p>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
                <p className="text-sm font-mono break-all text-neon-blue">{meetingLink}</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={copyMeetingLink}
                  className="flex-grow py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Copy Link
                </button>
                <a 
                  href={meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all text-center"
                >
                  Join Now
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;

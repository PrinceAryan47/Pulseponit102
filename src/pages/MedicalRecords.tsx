import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { MedicalRecord, UserProfile } from '../types';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  User, 
  ChevronRight,
  Filter,
  Plus,
  X,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import GuestOverlay from '../components/GuestOverlay';
import VoiceSearch from '../components/VoiceSearch';

const MedicalRecords: React.FC = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [patients, setPatients] = useState<UserProfile[]>([]);
  
  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;

    if (profile.role === 'doctor') {
      const fetchPatients = async () => {
        const q = query(collection(db, 'users'), where('role', '==', 'patient'));
        const snap = await getDocs(q);
        setPatients(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as UserProfile)));
      };
      fetchPatients();
    }

    const qField = profile.role === 'patient' ? 'patientId' : 'doctorId';
    const q = query(
      collection(db, 'medicalRecords'),
      where(qField, '==', profile.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MedicalRecord)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const displayRecords = records;

  const filteredRecords = displayRecords.filter(r => 
    r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedPatientId || !diagnosis) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'medicalRecords'), {
        patientId: selectedPatientId,
        doctorId: profile.uid,
        doctorName: profile.fullName,
        date: new Date().toISOString(),
        diagnosis,
        prescription,
        notes,
        createdAt: new Date().toISOString()
      });
      setIsAddModalOpen(false);
      setDiagnosis('');
      setPrescription('');
      setNotes('');
      setSelectedPatientId('');
    } catch (error) {
      console.error("Error adding medical record:", error);
      alert("Failed to add record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GuestOverlay
      title="Access Medical Records"
      description="Sign in to view your consultation history, prescriptions, and health reports securely."
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight neon-text">Medical Records</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Access your consultation history, prescriptions, and health reports securely.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by diagnosis or doctor..."
              className="w-full pl-12 pr-12 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
            />
            <VoiceSearch 
              onResult={(text) => setSearchTerm(text)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            />
          </div>
          {profile?.role === 'doctor' && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow"
            >
              <Plus className="w-5 h-5" />
              Add Record
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {filteredRecords.map((record, idx) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-card rounded-3xl border border-border shadow-sm hover:shadow-md transition-all p-6 lg:p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="flex items-center gap-6 lg:w-1/3">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{record.diagnosis}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(record.date), 'MMMM dd, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Doctor</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="font-semibold text-foreground/80">{record.doctorName}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Prescription</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{record.prescription || 'No prescription written'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:justify-end">
                <button className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Download Report">
                  <Download className="w-6 h-6" />
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-bold hover:bg-muted/80 transition-all">
                  Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-muted/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No records found</h3>
            <p className="text-muted-foreground">Try adjusting your search or check back later.</p>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Add Medical Record</h2>
                    <p className="text-muted-foreground">Create a new consultation summary for a patient.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-3 bg-muted/50 text-muted-foreground hover:text-primary rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddRecord} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Select Patient</label>
                    <select
                      required
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground appearance-none"
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map(p => (
                        <option key={p.uid} value={p.uid}>{p.fullName} ({p.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Diagnosis</label>
                    <input
                      type="text"
                      required
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g., Acute Bronchitis"
                      className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Prescription</label>
                      <textarea
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        placeholder="List medications and dosage..."
                        className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground min-h-[120px] resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional observations or advice..."
                        className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground min-h-[120px] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-grow py-4 bg-muted/50 text-muted-foreground rounded-2xl font-bold hover:bg-muted transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Saving...' : (
                        <>
                          <Check className="w-5 h-5" />
                          Save Record
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </GuestOverlay>
  );
};

export default MedicalRecords;

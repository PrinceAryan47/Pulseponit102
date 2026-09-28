import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  User, 
  Send, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Clock, 
  Lock, 
  Sparkles,
  Building2,
  Stethoscope
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createNotification } from '../services/notificationService';
import { UserProfile, ConsentScope } from '../types';

interface DoctorConsentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: UserProfile | null;
  doctorProfile: UserProfile;
  existingRequest?: any;
  onSuccess?: () => void;
}

const AVAILABLE_SCOPES: { id: ConsentScope; label: string; description: string; icon: string }[] = [
  {
    id: 'personal_details',
    label: 'Personal & Contact Details',
    description: 'Full name, age, phone number, email address, city, height, and weight',
    icon: '👤'
  },
  {
    id: 'medical_history',
    label: 'Medical Consultation Records',
    description: 'Past doctor consultations, clinical diagnoses, and encounter progress notes',
    icon: '📋'
  },
  {
    id: 'allergies_conditions',
    label: 'Allergies & Medical Conditions',
    description: 'Drug and food allergies, chronic conditions, and vital medical warnings',
    icon: '⚠️'
  },
  {
    id: 'prescriptions',
    label: 'Prescription & Medication History',
    description: 'Current and historical prescriptions, dosages, and pharmacotherapy',
    icon: '💊'
  },
  {
    id: 'documents_scans',
    label: 'Clinical Documents & Lab Attachments',
    description: 'Uploaded diagnostic scans, lab reports, radiology, and PDF attachments',
    icon: '📁'
  }
];

const PURPOSE_PRESETS = [
  'Comprehensive Medical Evaluation & Diagnosis',
  'Pre-Consultation Clinical Assessment',
  'Medication & Prescription Therapy Review',
  'Specialist Second Opinion & Consultation',
  'Chronic Illness Management Plan',
  'Emergency Care & Clinical Clearance'
];

export const DoctorConsentRequestModal: React.FC<DoctorConsentRequestModalProps> = ({
  isOpen,
  onClose,
  patient,
  doctorProfile,
  existingRequest,
  onSuccess
}) => {
  const [selectedScopes, setSelectedScopes] = useState<ConsentScope[]>([
    'personal_details',
    'medical_history',
    'allergies_conditions',
    'prescriptions',
    'documents_scans'
  ]);
  const [purpose, setPurpose] = useState<string>(PURPOSE_PRESETS[0]);
  const [customNote, setCustomNote] = useState<string>('');
  const [duration, setDuration] = useState<string>('30_days');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen || !patient) return null;

  const toggleScope = (scopeId: ConsentScope) => {
    setSelectedScopes(prev => 
      prev.includes(scopeId)
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  const handleSelectAllScopes = () => {
    if (selectedScopes.length === AVAILABLE_SCOPES.length) {
      setSelectedScopes([]);
    } else {
      setSelectedScopes(AVAILABLE_SCOPES.map(s => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScopes.length === 0) {
      setStatusMessage({ text: 'Please select at least one data category to request access.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const reqId = `${patient.uid}_${doctorProfile.uid}`;

    try {
      // 1. Save / update the accessRequest document in Firestore
      await setDoc(doc(db, 'accessRequests', reqId), {
        id: reqId,
        patientId: patient.uid,
        patientName: patient.fullName || 'Patient',
        doctorId: doctorProfile.uid,
        doctorName: doctorProfile.fullName || 'Doctor',
        doctorSpecialization: doctorProfile.specialization || 'Medical Specialist',
        doctorHospital: doctorProfile.hospitalName || doctorProfile.workplace?.hospitalName || 'PulsePoint Health Facility',
        requestedScopes: selectedScopes,
        purpose,
        customNote: customNote.trim() || `Doctor ${doctorProfile.fullName} requests your authorization to access medical records and personal details for ${purpose.toLowerCase()}.`,
        duration,
        status: 'pending',
        createdAt: existingRequest?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Dispatch real-time interactive notification to the patient
      // This immediately triggers the patient's notification bell and sliding pop-up toast!
      await createNotification(
        patient.uid,
        `Consent Request: Data Access Authorization`,
        `Dr. ${doctorProfile.fullName} has sent a formal consent request to access your personal details and medical records for: "${purpose}". Tap to review and authorize.`,
        'consent_request',
        {
          requestId: reqId,
          doctorId: doctorProfile.uid,
          doctorName: doctorProfile.fullName,
          requestedScopes: selectedScopes,
          purpose
        }
      );

      setStatusMessage({ 
        text: `Consent request successfully sent to ${patient.fullName}! They will receive an instant notification pop-up to review and authorize access.`, 
        type: 'success' 
      });

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1800);
    } catch (err: any) {
      console.error('Error sending consent request:', err);
      setStatusMessage({ text: err.message || 'Failed to dispatch consent request. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-card text-card-foreground border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          {/* Modal Header */}
          <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    Doctor Clinical Portal
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-500" /> HIPAA / GDPR Compliant
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground">Request Patient Data Consent</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {statusMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-3 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Target Patient Card */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                {patient.photoURL ? (
                  <img src={patient.photoURL} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary/20" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {patient.fullName?.charAt(0) || 'P'}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                    {patient.fullName}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                      ID: {patient.uid.slice(0, 8)}
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {patient.age ? `${patient.age} yrs` : 'Age N/A'} • {patient.gender || 'Patient'} • {patient.city || 'Location unspecified'}
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Requesting Physician</span>
                <span className="text-xs font-bold text-foreground">Dr. {doctorProfile.fullName}</span>
              </div>
            </div>

            {/* Clinical Purpose Preset */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Clinical Purpose of Access</span>
                <span className="text-[10px] text-primary lowercase font-medium">Required for medical transparency</span>
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              >
                {PURPOSE_PRESETS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Categories to Request */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Patient Data to Access ({selectedScopes.length} selected)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllScopes}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {selectedScopes.length === AVAILABLE_SCOPES.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2.5">
                {AVAILABLE_SCOPES.map((scope) => {
                  const isChecked = selectedScopes.includes(scope.id);
                  return (
                    <div
                      key={scope.id}
                      onClick={() => toggleScope(scope.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                        isChecked
                          ? 'bg-primary/5 border-primary/40 shadow-sm'
                          : 'bg-muted/20 border-border hover:bg-muted/40'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-primary shrink-0 transition-transform active:scale-90"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{scope.icon}</span>
                          <h5 className="font-bold text-xs text-foreground">{scope.label}</h5>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {scope.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Access Validity Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Authorized Duration</span>
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="encounter">Single Consultation Encounter</option>
                  <option value="30_days">30 Days (Active Treatment)</option>
                  <option value="90_days">90 Days (Extended Care)</option>
                  <option value="1_year">1 Year (Ongoing Primary Care)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>Practice / Facility</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={doctorProfile.hospitalName || doctorProfile.workplace?.hospitalName || 'PulsePoint Health Facility'}
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs font-semibold text-muted-foreground"
                />
              </div>
            </div>

            {/* Doctor Note to Patient */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Personal Note / Instructions to Patient (Optional)</span>
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                rows={2}
                placeholder="e.g. Dear patient, I need to review your past allergy history and current prescriptions prior to our scheduled appointment."
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs font-normal focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Live Notification Preview Box */}
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-foreground/80 leading-relaxed">
                <strong className="text-primary font-bold">Real-time Notification Notice:</strong> Sending this form will immediately generate a high-priority 
                alert that pops up on the patient's notification bar. The patient can review your request and authorize access in one tap.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedScopes.length === 0}
                className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neon-blue-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Consent Form</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

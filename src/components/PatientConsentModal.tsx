import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShieldCheck, 
  Check, 
  XCircle, 
  FileText, 
  Stethoscope, 
  Lock, 
  AlertCircle, 
  CheckSquare, 
  Square,
  Building2,
  Calendar,
  PenTool,
  Clock,
  Sparkles
} from 'lucide-react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ConsentScope, AccessRequest } from '../types';

interface PatientConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AccessRequest | any | null;
  onSuccess?: (approved: boolean) => void;
}

const SCOPE_META: Record<ConsentScope, { label: string; description: string; icon: string }> = {
  personal_details: {
    label: 'Personal & Contact Details',
    description: 'Full name, phone, age, gender, address/city, emergency contact information',
    icon: '👤'
  },
  medical_history: {
    label: 'Medical Consultation Records',
    description: 'Encounter histories, past clinical diagnoses, notes, and medical consultations',
    icon: '📋'
  },
  allergies_conditions: {
    label: 'Allergies & Medical Conditions',
    description: 'Drug allergies, dietary sensitivities, and chronic condition alerts',
    icon: '⚠️'
  },
  prescriptions: {
    label: 'Prescription & Medication History',
    description: 'Active prescriptions, drug dosages, and medication history',
    icon: '💊'
  },
  documents_scans: {
    label: 'Clinical Documents & Lab Attachments',
    description: 'Diagnostic lab tests, imaging scans, and attached PDF reports',
    icon: '📁'
  }
};

export const PatientConsentModal: React.FC<PatientConsentModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess
}) => {
  const { user, profile } = useAuth();
  const [grantedScopes, setGrantedScopes] = useState<ConsentScope[]>([]);
  const [signatureName, setSignatureName] = useState<string>('');
  const [hasAgreedTerms, setHasAgreedTerms] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (request?.requestedScopes && Array.isArray(request.requestedScopes)) {
      setGrantedScopes(request.requestedScopes);
    } else {
      setGrantedScopes(['personal_details', 'medical_history', 'allergies_conditions', 'prescriptions', 'documents_scans']);
    }
    if (profile?.fullName) {
      setSignatureName(profile.fullName);
    }
  }, [request, profile]);

  if (!isOpen || !request) return null;

  const toggleScope = (scope: ConsentScope) => {
    setGrantedScopes(prev => 
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const handleGrantConsent = async () => {
    if (grantedScopes.length === 0) {
      setActionFeedback({ text: 'Please select at least one data category to share with your doctor.', type: 'error' });
      return;
    }
    if (!signatureName.trim()) {
      setActionFeedback({ text: 'Please enter your digital signature (full name) to confirm authorization.', type: 'error' });
      return;
    }

    setIsProcessing(true);
    setActionFeedback(null);

    try {
      // 1. Update the accessRequests document
      await updateDoc(doc(db, 'accessRequests', request.id), {
        status: 'approved',
        grantedScopes,
        patientSignature: signatureName.trim(),
        respondedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Notify the doctor that consent was granted
      await addDoc(collection(db, 'notifications'), {
        userId: request.doctorId,
        title: 'Consent Granted by Patient',
        message: `${profile?.fullName || request.patientName || 'The patient'} has approved your consent request to access their personal health records and details.`,
        type: 'alert',
        read: false,
        createdAt: serverTimestamp(),
        requestId: request.id,
        doctorId: request.doctorId
      });

      setActionFeedback({ 
        text: `Consent successfully authorized! Dr. ${request.doctorName || 'Doctor'} has been granted secure access.`, 
        type: 'success' 
      });

      if (onSuccess) {
        onSuccess(true);
      }

      setTimeout(() => {
        onClose();
        setActionFeedback(null);
      }, 1600);
    } catch (error: any) {
      console.error('Error granting consent:', error);
      setActionFeedback({ text: error.message || 'Failed to grant consent. Please try again.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineConsent = async () => {
    setIsProcessing(true);
    setActionFeedback(null);

    try {
      // 1. Update the accessRequests document
      await updateDoc(doc(db, 'accessRequests', request.id), {
        status: 'rejected',
        respondedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Notify the doctor
      await addDoc(collection(db, 'notifications'), {
        userId: request.doctorId,
        title: 'Consent Request Declined',
        message: `${profile?.fullName || request.patientName || 'The patient'} has declined the request for personal medical records access.`,
        type: 'alert',
        read: false,
        createdAt: serverTimestamp(),
        requestId: request.id
      });

      setActionFeedback({ 
        text: `You have declined access for Dr. ${request.doctorName || 'Doctor'}. No data has been shared.`, 
        type: 'success' 
      });

      if (onSuccess) {
        onSuccess(false);
      }

      setTimeout(() => {
        onClose();
        setActionFeedback(null);
      }, 1500);
    } catch (error: any) {
      console.error('Error declining consent:', error);
      setActionFeedback({ text: error.message || 'Failed to decline request. Please try again.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const requestedList: ConsentScope[] = request.requestedScopes && Array.isArray(request.requestedScopes)
    ? request.requestedScopes
    : (['personal_details', 'medical_history', 'allergies_conditions', 'prescriptions', 'documents_scans'] as ConsentScope[]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-card text-card-foreground border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    Digital Health Consent Agreement
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-500" /> Patient Privacy Protected
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground">Doctor Data Access Authorization</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {actionFeedback && (
              <div
                className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-3 ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}
              >
                {actionFeedback.type === 'success' ? (
                  <Check className="w-5 h-5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                )}
                <span>{actionFeedback.text}</span>
              </div>
            )}

            {/* Requesting Doctor Info Card */}
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                  <Stethoscope className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-foreground">
                      Dr. {request.doctorName || 'Medical Specialist'}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Clinician
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {request.doctorSpecialization || 'Physician'} • {request.doctorHospital || 'PulsePoint Clinical Center'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Requested on: {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Today'}
                  </p>
                </div>
              </div>

              {request.duration && (
                <div className="sm:text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Authorized Term</span>
                  <span className="text-xs font-bold text-primary flex items-center gap-1 sm:justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    {request.duration === 'encounter' ? 'Single Encounter' : request.duration.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>

            {/* Purpose & Note From Doctor */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                Doctor's Clinical Purpose & Reason
              </span>
              <p className="text-sm font-semibold text-foreground">
                {request.purpose || 'Comprehensive Medical Evaluation & Diagnosis'}
              </p>
              {request.customNote && (
                <p className="text-xs text-muted-foreground italic bg-background/50 p-3 rounded-xl border border-border/50">
                  "{request.customNote}"
                </p>
              )}
            </div>

            {/* Requested Data Scopes With Patient Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Grant Access to the Following Categories:
                </label>
                <span className="text-[11px] text-primary font-medium">
                  {grantedScopes.length} of {requestedList.length} categories enabled
                </span>
              </div>

              <div className="space-y-2">
                {requestedList.map((scope) => {
                  const meta = SCOPE_META[scope] || {
                    label: scope.replace('_', ' ').toUpperCase(),
                    description: 'Patient medical data records',
                    icon: '📄'
                  };
                  const isChecked = grantedScopes.includes(scope);

                  return (
                    <div
                      key={scope}
                      onClick={() => toggleScope(scope)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-primary/5 border-primary/40 shadow-sm'
                          : 'bg-muted/20 border-border hover:bg-muted/40 opacity-70'
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
                          <span className="text-sm">{meta.icon}</span>
                          <h5 className="font-bold text-xs text-foreground">{meta.label}</h5>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {meta.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Electronic Signature Box */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-primary" />
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Patient Electronic Signature Confirmation
                </label>
              </div>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Type your full legal name to sign..."
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary outline-none"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                By typing your name, you acknowledge that you are the patient or their authorized healthcare proxy, 
                and you authorize Dr. {request.doctorName || 'Doctor'} to review the selected medical information 
                for healthcare purposes. You may revoke this permission at any time.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDeclineConsent}
                disabled={isProcessing}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/20"
              >
                Decline Request
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl transition-all"
                >
                  Decide Later
                </button>
                <button
                  type="button"
                  onClick={handleGrantConsent}
                  disabled={isProcessing || grantedScopes.length === 0}
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neon-blue-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Grant Consent & Authorize</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

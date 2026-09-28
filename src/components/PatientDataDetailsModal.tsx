import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  ShieldCheck, 
  FileText, 
  Pill, 
  AlertTriangle, 
  Download, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Activity, 
  Stethoscope,
  Clock,
  CheckCircle2,
  ExternalLink,
  Lock
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, MedicalRecord, AccessRequest } from '../types';
import { downloadMedicalRecordPDF, downloadAttachmentFile } from '../utils/medicalDocumentUtils';
import { MedicalRecordDetailsModal } from './MedicalRecordDetailsModal';

interface PatientDataDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: UserProfile | null;
  consentRequest?: AccessRequest | any;
}

export const PatientDataDetailsModal: React.FC<PatientDataDetailsModalProps> = ({
  isOpen,
  onClose,
  patient,
  consentRequest
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'prescriptions' | 'documents'>('overview');
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<MedicalRecord | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !patient?.uid) {
      setMedicalRecords([]);
      return;
    }

    setLoadingRecords(true);
    const q = query(
      collection(db, 'medicalRecords'),
      where('patientId', '==', patient.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MedicalRecord));
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMedicalRecords(records);
      setLoadingRecords(false);
    }, (error) => {
      console.error("Error fetching patient medical records in modal:", error);
      setLoadingRecords(false);
    });

    return () => unsubscribe();
  }, [isOpen, patient?.uid]);

  if (!isOpen || !patient) return null;

  const grantedScopes: string[] = consentRequest?.grantedScopes || [
    'personal_details', 
    'medical_history', 
    'allergies_conditions', 
    'prescriptions', 
    'documents_scans'
  ];

  const handleDownloadRecord = async (record: MedicalRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloadingDoc(record.id);
      await downloadMedicalRecordPDF({
        record,
        patientName: patient.fullName,
        patientAge: patient.age,
        patientGender: patient.gender,
        patientEmail: patient.email
      });
    } catch (err) {
      console.error("Failed to download record PDF:", err);
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleDownloadAttachment = async (attachment: any, recordTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof attachment === 'string' ? attachment : attachment.url;
    const name = typeof attachment === 'string' ? `${recordTitle}_attachment` : (attachment.name || 'document');
    setDownloadingDoc(name);
    try {
      await downloadAttachmentFile(url, name);
    } catch (err) {
      console.error("Error downloading attachment:", err);
    } finally {
      setDownloadingDoc(null);
    }
  };

  // Collect all documents across all medical records
  const allDocuments = medicalRecords.flatMap(record => {
    const rawAttachments = record.documents || record.attachments || [];
    return rawAttachments.map((att: any, idx) => ({
      recordId: record.id,
      recordDate: record.date,
      recordDiagnosis: record.diagnosis,
      doctorName: record.doctorName,
      attachment: att,
      key: `${record.id}_att_${idx}`
    }));
  });

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-card text-card-foreground border border-border w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                {patient.photoURL ? (
                  <img src={patient.photoURL} alt="" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                    {patient.fullName?.charAt(0) || 'P'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">{patient.fullName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Authorized Patient
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {patient.age ? `${patient.age} yrs` : 'Age N/A'} • {patient.gender || 'Patient'} • ID: {patient.uid.slice(0, 10)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right pr-3 border-r border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Consent Status</span>
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Authorization
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 border-b border-border bg-muted/20 flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Personal Details & Vitals
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'records'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Medical Encounters ({medicalRecords.length})
              </button>
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'prescriptions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                Prescriptions
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'documents'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Attachments & Reports ({allDocuments.length})
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: OVERVIEW & PERSONAL DETAILS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Demographics Grid */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" /> Personal Demographics & Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Full Legal Name</span>
                        <span className="text-sm font-bold text-foreground mt-0.5 block">{patient.fullName}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Phone Contact</span>
                        <span className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                          {patient.phoneNumber || 'Not provided'}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Email Address</span>
                        <span className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{patient.email}</span>
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Location / City</span>
                        <span className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          {patient.city || 'Not provided'}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Age / Gender</span>
                        <span className="text-sm font-bold text-foreground mt-0.5 block">
                          {patient.age ? `${patient.age} years old` : 'Age unrecorded'} • {patient.gender || 'Unspecified'}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Height & Weight</span>
                        <span className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-primary" />
                          {patient.height ? `${patient.height} cm` : 'Height N/A'} • {patient.weight ? `${patient.weight} kg` : 'Weight N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Alerts / Allergies / Conditions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Known Allergies & Drug Sensitivities</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                        {patient.allergies || 'No known allergies reported by the patient.'}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                        <Activity className="w-4 h-4" />
                        <span>Chronic Conditions & Medical History</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                        {patient.conditions || 'No chronic health conditions recorded in patient profile.'}
                      </p>
                    </div>
                  </div>

                  {/* Consent Audit Notice */}
                  {consentRequest && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-foreground/80">
                        <Lock className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          <strong>Signed Authorization:</strong> Authorized by {consentRequest.patientSignature || patient.fullName} on{' '}
                          {consentRequest.respondedAt ? new Date(consentRequest.respondedAt).toLocaleDateString() : 'Active session'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">
                        HIPAA Record Token #{consentRequest.id.slice(0, 8)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MEDICAL RECORDS */}
              {activeTab === 'records' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Clinical Encounters & Doctor Reports
                    </h4>
                    <span className="text-xs text-muted-foreground">{medicalRecords.length} records available</span>
                  </div>

                  {loadingRecords ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs">Loading patient consultation records...</p>
                    </div>
                  ) : medicalRecords.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-muted/20 border border-border">
                      <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-bold text-foreground">No clinical records found</p>
                      <p className="text-xs text-muted-foreground mt-1">This patient does not have previous recorded consultations yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medicalRecords.map((record) => (
                        <div
                          key={record.id}
                          className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                                {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                              </span>
                              <h5 className="font-bold text-sm text-foreground truncate">{record.diagnosis}</h5>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {record.notes || 'No encounter notes added.'}
                            </p>
                            {record.doctorName && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                                <Stethoscope className="w-3 h-3 text-primary" /> Attending: Dr. {record.doctorName}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedRecordForModal(record)}
                              className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>
                            <button
                              onClick={(e) => handleDownloadRecord(record, e)}
                              disabled={downloadingDoc === record.id}
                              className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neon-blue-dark transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              {downloadingDoc === record.id ? (
                                <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>Download PDF</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PRESCRIPTIONS */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Prescriptions & Active Medication Regimens
                  </h4>
                  {medicalRecords.filter(r => r.prescription).length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-muted/20 border border-border">
                      <Pill className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-bold text-foreground">No prescription records available</p>
                      <p className="text-xs text-muted-foreground mt-1">No medication courses were prescribed in these records.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medicalRecords.filter(r => r.prescription).map((record) => (
                        <div key={record.id} className="p-5 rounded-2xl bg-card border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <Pill className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-sm text-foreground">{record.diagnosis}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-muted/40 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {record.prescription}
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={(e) => handleDownloadRecord(record, e)}
                              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Download Prescription Form
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DOCUMENTS & ATTACHMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Uploaded Diagnostic Lab Results & Attachments
                  </h4>
                  {allDocuments.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-muted/20 border border-border">
                      <Download className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-bold text-foreground">No document files attached</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Individual medical record reports can still be generated and downloaded as PDF from the Medical Encounters tab.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {allDocuments.map((item) => {
                        const att = item.attachment;
                        const name = typeof att === 'string' ? 'Medical Attachment' : (att.name || 'Clinical Document');
                        const url = typeof att === 'string' ? att : att.url;
                        return (
                          <div
                            key={item.key}
                            className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-foreground truncate">{name}</h5>
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                  {item.recordDiagnosis} • {item.recordDate ? new Date(item.recordDate).toLocaleDateString() : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDownloadAttachment(att, name, e)}
                              disabled={downloadingDoc === name}
                              className="p-2.5 bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary rounded-xl transition-all shrink-0"
                              title="Download File"
                            >
                              {downloadingDoc === name ? (
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                Confidential health data access verified by PulsePoint Clinical Governance.
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-muted text-foreground text-xs font-bold rounded-xl hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Record details modal drill-down */}
      {selectedRecordForModal && (
        <MedicalRecordDetailsModal
          isOpen={!!selectedRecordForModal}
          onClose={() => setSelectedRecordForModal(null)}
          record={selectedRecordForModal}
        />
      )}
    </>
  );
};

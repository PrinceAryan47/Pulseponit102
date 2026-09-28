import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { MedicalRecord, UserProfile, MedicalAttachment } from '../types';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  User, 
  ChevronRight, 
  Plus, 
  X, 
  Check, 
  Paperclip, 
  Loader2, 
  FileImage, 
  FileSpreadsheet, 
  Eye, 
  Upload,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import GuestOverlay from '../components/GuestOverlay';
import VoiceSearch from '../components/VoiceSearch';
import { MedicalRecordDetailsModal } from '../components/MedicalRecordDetailsModal';
import { 
  downloadMedicalRecordPDF, 
  downloadMedicalAttachment, 
  formatFileSize 
} from '../utils/medicalDocumentUtils';

const MedicalRecords: React.FC = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [patients, setPatients] = useState<UserProfile[]>([]);
  
  // Selected record for details modal
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Download tracking state
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [downloadingDocName, setDownloadingDocName] = useState<string | null>(null);

  // Form state for adding record
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [labResults, setLabResults] = useState('');
  const [formAttachments, setFormAttachments] = useState<MedicalAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    if (profile.role === 'doctor') {
      const fetchPatients = async () => {
        try {
          const q = query(collection(db, 'users'), where('role', '==', 'patient'));
          const snap = await getDocs(q);
          setPatients(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as UserProfile)));
        } catch (e) {
          console.error("Error fetching patients:", e);
        }
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
    }, (error) => {
      console.error("Error fetching medical records:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const displayRecords = records;

  const filteredRecords = displayRecords.filter(r => 
    r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.prescription || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle single file upload in the Add Record modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setFileUploadError("File size exceeds 10MB limit.");
      return;
    }

    setFileUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const newDoc: MedicalAttachment = {
        name: file.name,
        url: base64Data,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
      setFormAttachments(prev => [...prev, newDoc]);
    };
    reader.onerror = () => {
      setFileUploadError("Failed to read file.");
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setFormAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedPatientId || !diagnosis) return;

    setIsSubmitting(true);
    try {
      const patient = patients.find(p => p.uid === selectedPatientId);
      await addDoc(collection(db, 'medicalRecords'), {
        patientId: selectedPatientId,
        patientName: patient?.fullName || 'Patient',
        doctorId: profile.uid,
        doctorName: profile.fullName,
        date: new Date().toISOString(),
        diagnosis,
        prescription,
        notes,
        labResults,
        documents: formAttachments,
        attachments: formAttachments.map(a => a.url),
        createdAt: new Date().toISOString()
      });

      setIsAddModalOpen(false);
      setDiagnosis('');
      setPrescription('');
      setNotes('');
      setLabResults('');
      setFormAttachments([]);
      setSelectedPatientId('');
    } catch (error) {
      console.error("Error adding medical record:", error);
      alert("Failed to add record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct card PDF download
  const handleDownloadRecordPDF = async (record: MedicalRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGeneratingPdfId(record.id);
    try {
      await downloadMedicalRecordPDF({
        record,
        patientName: record.patientName || profile?.fullName || 'Verified Patient',
        patientAge: profile?.age || 'N/A',
        patientGender: profile?.gender || 'N/A',
        patientEmail: profile?.email || ''
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Could not generate report at this time. Please try again.");
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Direct attachment download
  const handleDownloadAttachment = async (
    docItem: MedicalAttachment | string, 
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const docName = typeof docItem === 'object' ? docItem.name : 'document';
    setDownloadingDocName(docName);
    try {
      await downloadMedicalAttachment(docItem);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      alert(`Could not download ${docName}`);
    } finally {
      setDownloadingDocName(null);
    }
  };

  const openDetails = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  // Helper to extract list of attachments
  const getRecordAttachments = (record: MedicalRecord): MedicalAttachment[] => {
    const list: MedicalAttachment[] = [];
    if (record.documents && Array.isArray(record.documents)) {
      list.push(...record.documents);
    }
    if (record.attachments && Array.isArray(record.attachments)) {
      record.attachments.forEach((att, idx) => {
        if (typeof att === 'string') {
          if (!list.some(item => item.url === att)) {
            const name = att.split('/').pop()?.split('?')[0] || `Attachment_${idx + 1}.pdf`;
            list.push({
              name,
              url: att,
              type: att.includes('data:image') || att.match(/\.(jpg|jpeg|png)$/i) ? 'image/png' : 'application/pdf'
            });
          }
        } else if (att && typeof att === 'object') {
          if (!list.some(item => item.name === att.name || item.url === att.url)) {
            list.push(att);
          }
        }
      });
    }
    return list;
  };

  const getDocIcon = (type?: string, name?: string) => {
    const lowerType = (type || '').toLowerCase();
    const lowerName = (name || '').toLowerCase();

    if (lowerType.includes('image') || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      return <FileImage className="w-4 h-4 text-sky-500 shrink-0" />;
    }
    if (lowerType.includes('sheet') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (lowerType.includes('pdf') || lowerName.endsWith('.pdf')) {
      return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
    }
    return <Paperclip className="w-4 h-4 text-primary shrink-0" />;
  };

  return (
    <GuestOverlay
      title="Access Medical Records"
      description="Sign in to view your consultation history, prescriptions, and health reports securely."
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight neon-text">Medical Records & Documents</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Access your clinical consultation history, laboratory results, diagnostic scans, and download official medical records securely.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search diagnosis, doctor, Rx..."
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
                Add Record & Documents
              </button>
            )}
          </div>
        </div>

        {/* Records Listing */}
        <div className="space-y-6">
          {filteredRecords.map((record, idx) => {
            const attachmentsList = getRecordAttachments(record);
            const isGeneratingThisPdf = generatingPdfId === record.id;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-card rounded-3xl border border-border shadow-sm hover:shadow-md transition-all p-6 lg:p-8"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Diagnosis & Date */}
                  <div className="flex items-start sm:items-center gap-5 lg:w-1/3">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 text-primary">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-foreground mb-1">{record.diagnosis}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{record.date ? format(new Date(record.date), 'MMMM dd, yyyy') : 'Recent Encounter'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor & Prescription Overview */}
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Attending Doctor</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-semibold text-foreground/90">Dr. {record.doctorName || 'Clinical Specialist'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Prescription / Treatment</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {record.prescription || 'No prescription specified'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: 1-Click PDF Download & Details */}
                  <div className="flex items-center gap-2.5 lg:justify-end shrink-0 pt-2 lg:pt-0">
                    <button 
                      onClick={(e) => handleDownloadRecordPDF(record, e)}
                      disabled={isGeneratingThisPdf}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-2xl font-bold transition-all shadow-sm disabled:opacity-50"
                      title="Download Official Medical Record (PDF)"
                    >
                      {isGeneratingThisPdf ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-xs">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          <span className="text-xs">Download Report</span>
                        </>
                      )}
                    </button>

                    <button 
                      onClick={() => openDetails(record)}
                      className="flex items-center gap-2 px-5 py-3 bg-muted text-foreground rounded-2xl font-bold hover:bg-muted/80 transition-all text-xs"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Attached Documents Strip (if present) */}
                {attachmentsList.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Paperclip className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Attached Clinical Documents ({attachmentsList.length}):
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {attachmentsList.map((docItem, docIdx) => (
                        <div
                          key={docIdx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/40 hover:bg-muted/70 border border-border rounded-xl transition-all text-xs"
                        >
                          {getDocIcon(docItem.type, docItem.name)}
                          <span className="font-semibold text-foreground/90 max-w-[180px] sm:max-w-[240px] truncate" title={docItem.name}>
                            {docItem.name}
                          </span>
                          {docItem.size ? (
                            <span className="text-[10px] text-muted-foreground">({formatFileSize(docItem.size)})</span>
                          ) : null}

                          <button
                            onClick={(e) => handleDownloadAttachment(docItem, e)}
                            disabled={downloadingDocName === docItem.name}
                            className="p-1 hover:bg-primary/20 text-primary rounded-lg transition-colors ml-1"
                            title={`Download ${docItem.name}`}
                          >
                            {downloadingDocName === docItem.name ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {filteredRecords.length === 0 && !loading && (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border p-8">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-muted/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No medical records found</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-sm mb-6">
                No consultations or clinical reports match your search criteria.
              </p>
              {profile?.role === 'doctor' && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create First Consultation Record
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Record Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card w-full max-w-2xl my-8 rounded-[2.5rem] shadow-2xl overflow-hidden border border-border"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-1">Add Medical Record</h2>
                      <p className="text-muted-foreground text-sm">Create a consultation summary and attach diagnostic documents for a patient.</p>
                    </div>
                    <button 
                      onClick={() => setIsAddModalOpen(false)}
                      className="p-3 bg-muted/50 text-muted-foreground hover:text-primary rounded-2xl transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleAddRecord} className="space-y-5">
                    {/* Patient Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Select Patient</label>
                      <select
                        required
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full px-5 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground appearance-none text-sm"
                      >
                        <option value="">Choose a patient...</option>
                        {patients.map(p => (
                          <option key={p.uid} value={p.uid}>{p.fullName} ({p.email})</option>
                        ))}
                      </select>
                    </div>

                    {/* Primary Diagnosis */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Clinical Diagnosis</label>
                      <input
                        type="text"
                        required
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g., Acute Upper Respiratory Tract Infection"
                        className="w-full px-5 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm"
                      />
                    </div>

                    {/* Prescription & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Prescription (Rx)</label>
                        <textarea
                          value={prescription}
                          onChange={(e) => setPrescription(e.target.value)}
                          placeholder="e.g., Amoxicillin 500mg tid x 7 days..."
                          className="w-full px-5 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground min-h-[100px] resize-none text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Clinical Directives & Notes</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Observation notes, recovery timeline..."
                          className="w-full px-5 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground min-h-[100px] resize-none text-sm"
                        />
                      </div>
                    </div>

                    {/* Diagnostic / Lab Results field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Lab / Diagnostic Findings (Optional)</label>
                      <input
                        type="text"
                        value={labResults}
                        onChange={(e) => setLabResults(e.target.value)}
                        placeholder="e.g., Hemoglobin: 14.2 g/dL, WBC: 6,800 /mcL, CRP: Negative"
                        className="w-full px-5 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground text-sm"
                      />
                    </div>

                    {/* Document Attachments Uploader */}
                    <div className="space-y-2 border border-dashed border-border rounded-2xl p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                          <Paperclip className="w-4 h-4 text-primary" />
                          <span>Attach Diagnostic Documents & Scans (PDF / Images)</span>
                        </label>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-neon-blue-dark transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                          />
                        </label>
                      </div>

                      {fileUploadError && (
                        <p className="text-xs text-rose-500">{fileUploadError}</p>
                      )}

                      {formAttachments.length > 0 ? (
                        <div className="space-y-2 pt-2">
                          {formAttachments.map((fileItem, fileIdx) => (
                            <div key={fileIdx} className="flex items-center justify-between p-2.5 bg-card border border-border rounded-xl text-xs">
                              <div className="flex items-center gap-2 truncate">
                                {getDocIcon(fileItem.type, fileItem.name)}
                                <span className="font-semibold text-foreground truncate">{fileItem.name}</span>
                                {fileItem.size && (
                                  <span className="text-muted-foreground shrink-0">({formatFileSize(fileItem.size)})</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(fileIdx)}
                                className="p-1 hover:bg-muted text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No files attached yet. Patients can download any attached files directly from their records.
                        </p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="flex-grow py-3.5 bg-muted/50 text-muted-foreground rounded-2xl font-bold hover:bg-muted transition-all text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 neon-glow disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Record & Documents...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            <span>Save Record</span>
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

        {/* Details & Document Download Modal */}
        <MedicalRecordDetailsModal
          record={selectedRecord}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          currentUser={profile}
          onRecordUpdated={(updatedRecord) => {
            setSelectedRecord(updatedRecord);
            setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
          }}
        />
      </div>
    </GuestOverlay>
  );
};

export default MedicalRecords;

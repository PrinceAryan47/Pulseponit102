import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Pill, 
  FileCheck, 
  Paperclip, 
  Upload, 
  Eye, 
  Check, 
  Loader2,
  FileSpreadsheet,
  FileImage,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { MedicalRecord, MedicalAttachment, UserProfile } from '../types';
import { 
  downloadMedicalRecordPDF, 
  downloadMedicalAttachment, 
  downloadMedicalRecordJSON, 
  formatFileSize 
} from '../utils/medicalDocumentUtils';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

interface MedicalRecordDetailsModalProps {
  record: MedicalRecord | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onRecordUpdated?: (updatedRecord: MedicalRecord) => void;
}

export const MedicalRecordDetailsModal: React.FC<MedicalRecordDetailsModalProps> = ({
  record,
  isOpen,
  onClose,
  currentUser,
  onRecordUpdated
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadingDocName, setDownloadingDocName] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  // Normalize all documents/attachments
  const attachments: MedicalAttachment[] = [];
  if (record.documents && Array.isArray(record.documents)) {
    attachments.push(...record.documents);
  }
  if (record.attachments && Array.isArray(record.attachments)) {
    record.attachments.forEach((att, idx) => {
      if (typeof att === 'string') {
        const isAlreadyAdded = attachments.some(a => a.url === att);
        if (!isAlreadyAdded) {
          const name = att.split('/').pop()?.split('?')[0] || `Medical_Document_${idx + 1}.pdf`;
          attachments.push({
            name,
            url: att,
            type: att.includes('.png') || att.includes('.jpg') || att.includes('data:image') ? 'image/png' : 'application/pdf'
          });
        }
      } else if (att && typeof att === 'object') {
        const isAlreadyAdded = attachments.some(a => a.url === att.url || a.name === att.name);
        if (!isAlreadyAdded) {
          attachments.push(att);
        }
      }
    });
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await downloadMedicalRecordPDF({
        record,
        patientName: record.patientName || currentUser?.fullName || 'Verified Patient',
        patientAge: currentUser?.age || 'N/A',
        patientGender: currentUser?.gender || 'N/A',
        patientEmail: currentUser?.email || ''
      });
    } catch (err) {
      console.error('Failed to download record PDF:', err);
      alert('Could not generate PDF at this time. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadSingleDocument = async (docItem: MedicalAttachment) => {
    setDownloadingDocName(docItem.name);
    try {
      await downloadMedicalAttachment(docItem);
    } catch (err) {
      console.error('Download error:', err);
      alert(`Could not download ${docItem.name}`);
    } finally {
      setDownloadingDocName(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const newAttachment: MedicalAttachment = {
          name: file.name,
          url: base64Data,
          type: file.type || 'application/octet-stream',
          size: file.size,
          uploadedAt: new Date().toISOString()
        };

        // Update Firestore
        const recordRef = doc(db, 'medicalRecords', record.id);
        await updateDoc(recordRef, {
          documents: arrayUnion(newAttachment),
          attachments: arrayUnion(newAttachment.url)
        });

        const updatedRecord: MedicalRecord = {
          ...record,
          documents: [...(record.documents || []), newAttachment],
          attachments: [...(record.attachments || []), newAttachment.url]
        };

        if (onRecordUpdated) {
          onRecordUpdated(updatedRecord);
        }

        alert(`Document "${file.name}" attached successfully!`);
      } catch (err: any) {
        console.error('Error saving document to record:', err);
        setUploadError(err.message || 'Failed to attach document.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAttachSampleLab = async () => {
    setIsUploading(true);
    try {
      // Create a sample clinical report attachment
      const sampleContent = `PULSEPOINT CLINICAL LABORATORY REPORT\nTest: Complete Blood Count (CBC) with Differential\nPatient: ${record.patientName || currentUser?.fullName || 'Patient'}\nDate: ${new Date().toLocaleDateString()}\nStatus: Normal reference range verified by Laboratory Pathologist.`;
      const sampleBase64 = `data:text/plain;base64,${btoa(sampleContent)}`;
      const sampleAttachment: MedicalAttachment = {
        name: `Clinical_Lab_Report_CBC_${new Date().getFullYear()}.txt`,
        url: sampleBase64,
        type: 'text/plain',
        size: sampleContent.length,
        uploadedAt: new Date().toISOString()
      };

      const recordRef = doc(db, 'medicalRecords', record.id);
      await updateDoc(recordRef, {
        documents: arrayUnion(sampleAttachment),
        attachments: arrayUnion(sampleAttachment.url)
      });

      const updatedRecord: MedicalRecord = {
        ...record,
        documents: [...(record.documents || []), sampleAttachment],
        attachments: [...(record.attachments || []), sampleAttachment.url]
      };

      if (onRecordUpdated) {
        onRecordUpdated(updatedRecord);
      }
    } catch (err: any) {
      console.error('Failed to attach sample report:', err);
      setUploadError(err.message || 'Failed to attach sample report.');
    } finally {
      setIsUploading(false);
    }
  };

  const getDocIcon = (type?: string, name?: string) => {
    const lowerType = (type || '').toLowerCase();
    const lowerName = (name || '').toLowerCase();

    if (lowerType.includes('image') || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      return <FileImage className="w-5 h-5 text-sky-500" />;
    }
    if (lowerType.includes('sheet') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (lowerType.includes('pdf') || lowerName.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    return <Paperclip className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card w-full max-w-3xl my-8 rounded-[2.5rem] shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">Medical Consultation Record</h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                  Verified
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ref ID: <span className="font-mono text-primary font-semibold">REC-{(record.id || '').toUpperCase().substring(0, 8)}</span> • {record.date ? format(new Date(record.date), 'MMMM dd, yyyy') : 'Recent'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-muted/60 text-muted-foreground hover:text-foreground rounded-2xl hover:bg-muted transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-grow">
          {/* Diagnosis Hero Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Primary Diagnosis</p>
            <h3 className="text-2xl font-bold text-foreground">{record.diagnosis || 'Clinical Consultation'}</h3>
          </div>

          {/* Practitioner & Patient Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-2xl border border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Attending Doctor</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Dr. {record.doctorName || 'Clinical Specialist'}</p>
                  <p className="text-xs text-muted-foreground">PulsePoint Certified Practitioner</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Consultation Date</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {record.date ? format(new Date(record.date), 'EEEE, MMMM dd, yyyy') : 'Verified date'}
                  </p>
                  <p className="text-xs text-muted-foreground">Digital Electronic Health Record</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prescription section */}
          {record.prescription && (
            <div className="bg-card p-5 rounded-2xl border border-border space-y-2">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Prescribed Medication</h4>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap pl-6 leading-relaxed">
                {record.prescription}
              </p>
            </div>
          )}

          {/* Clinical Notes */}
          {record.notes && (
            <div className="bg-card p-5 rounded-2xl border border-border space-y-2">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Clinical Observations & Directives</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {record.notes}
              </p>
            </div>
          )}

          {/* Diagnostic & Lab Findings */}
          {record.labResults && (
            <div className="bg-card p-5 rounded-2xl border border-border space-y-2">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Diagnostic Findings & Lab Values</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {record.labResults}
              </p>
            </div>
          )}

          {/* Attached Documents & Files Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Attached Documents & Scans ({attachments.length})
                </h4>
              </div>

              {/* Upload Action */}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all border border-border">
                  <Upload className="w-3.5 h-3.5 text-primary" />
                  <span>Attach Document</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                    disabled={isUploading}
                  />
                </label>
                {attachments.length === 0 && (
                  <button
                    onClick={handleAttachSampleLab}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all"
                  >
                    + Add Sample Lab Report
                  </button>
                )}
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-xl">{uploadError}</p>
            )}

            {isUploading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted/30 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Uploading and sealing document to patient record...</span>
              </div>
            )}

            {attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((docItem, idx) => (
                  <div
                    key={idx}
                    className="bg-card hover:bg-muted/30 border border-border rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                        {getDocIcon(docItem.type, docItem.name)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-foreground truncate" title={docItem.name}>
                          {docItem.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {docItem.size ? formatFileSize(docItem.size) : 'Clinical Document'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Image preview button if applicable */}
                      {(docItem.type?.includes('image') || docItem.name.match(/\.(png|jpe?g)$/i)) && (
                        <button
                          onClick={() => setPreviewImage(docItem.url)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                          title="Preview scan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {/* Download File Button */}
                      <button
                        onClick={() => handleDownloadSingleDocument(docItem)}
                        disabled={downloadingDocName === docItem.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-sm"
                        title={`Download ${docItem.name}`}
                      >
                        {downloadingDocName === docItem.name ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/20 border border-dashed border-border rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-2">No external documents or laboratory scans attached yet.</p>
                <p className="text-[11px] text-muted-foreground/80">
                  You can download the complete clinical report as an official PDF below, or upload clinical attachments above.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Primary Download Actions */}
        <div className="p-6 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => downloadMedicalRecordJSON(record)}
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Data</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-muted text-foreground text-sm font-bold rounded-2xl hover:bg-muted/80 transition-all"
            >
              Close
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-2xl hover:bg-neon-blue-dark transition-all shadow-md shadow-primary/20 neon-glow disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Full Report (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 text-white rounded-full hover:bg-slate-700 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImage} 
              alt="Diagnostic Scan Preview" 
              className="max-h-[85vh] w-auto mx-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

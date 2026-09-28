import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MedicalRecord, MedicalAttachment } from '../types';

export interface MedicalRecordPDFOptions {
  record: MedicalRecord;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
  patientEmail?: string;
}

/**
 * Generates and downloads an official clinical Medical Record consultation PDF.
 */
export const downloadMedicalRecordPDF = async ({
  record,
  patientName = 'Verified Patient',
  patientAge = 'N/A',
  patientGender = 'N/A',
  patientEmail = ''
}: MedicalRecordPDFOptions) => {
  const element = document.createElement('div');
  element.style.padding = '40px 48px';
  element.style.width = '780px';
  element.style.backgroundColor = '#ffffff';
  element.style.color = '#0f172a';
  element.style.fontFamily = '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  element.style.lineHeight = '1.5';
  element.style.boxSizing = 'border-box';

  const formattedDate = record.date 
    ? new Date(record.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString();

  // Normalize attachments
  const attachmentsList: MedicalAttachment[] = [];
  if (record.documents && Array.isArray(record.documents)) {
    attachmentsList.push(...record.documents);
  }
  if (record.attachments && Array.isArray(record.attachments)) {
    record.attachments.forEach(att => {
      if (typeof att === 'string') {
        const name = att.split('/').pop()?.split('?')[0] || 'Medical_Attachment_Document';
        attachmentsList.push({ name, url: att });
      } else if (att && typeof att === 'object') {
        attachmentsList.push(att);
      }
    });
  }

  const attachmentsHTML = attachmentsList.length > 0 
    ? `
      <div style="margin-top: 24px; padding: 16px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h4 style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 700;">
          Verified Document Attachments & Clinical Scans (${attachmentsList.length})
        </h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155;">
          ${attachmentsList.map((doc, idx) => `
            <li style="margin-bottom: 4px;">
              <strong>${doc.name || `Document #${idx + 1}`}</strong> 
              ${doc.size ? `<span style="color: #64748b; font-size: 11px;">(${formatFileSize(doc.size)})</span>` : ''}
              ${doc.type ? `<span style="color: #0284c7; font-size: 10px; background: #e0f2fe; padding: 1px 6px; border-radius: 4px; margin-left: 6px;">${doc.type}</span>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `
    : '';

  element.innerHTML = `
    <!-- Top Header & Letterhead -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 18px; margin-bottom: 24px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <div style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; font-weight: 900; font-size: 16px; padding: 4px 10px; border-radius: 8px; display: inline-block;">P+</div>
          <span style="font-size: 24px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px;">PulsePoint Healthcare</span>
        </div>
        <p style="color: #64748b; font-size: 10px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Certified Electronic Health Record & Clinical Summary
        </p>
      </div>
      <div style="text-align: right;">
        <div style="display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 4px;">
          Official Record
        </div>
        <p style="color: #0f172a; font-weight: 700; font-size: 12px; margin: 0;">REF: <span style="font-family: monospace; color: #0284c7;">REC-${(record.id || 'N/A').toUpperCase().substring(0, 10)}</span></p>
        <p style="color: #64748b; font-size: 11px; margin: 2px 0 0 0;">Encounter Date: ${formattedDate}</p>
      </div>
    </div>

    <!-- Patient & Doctor Metadata Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 12px;">
        <h3 style="color: #0284c7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          Patient Demographics
        </h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Name:</strong> <span style="font-weight: 600; color: #0f172a;">${patientName}</span></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Patient ID:</strong> <span style="font-family: monospace; font-size: 12px;">${record.patientId?.substring(0, 12) || 'N/A'}</span></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Age / Gender:</strong> <span>${patientAge}</span> / <span style="text-transform: capitalize;">${patientGender}</span></p>
        ${patientEmail ? `<p style="margin: 4px 0; font-size: 12px;"><strong style="color: #475569;">Email:</strong> <span>${patientEmail}</span></p>` : ''}
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 12px;">
        <h3 style="color: #0284c7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          Attending Clinician
        </h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Practitioner:</strong> <span style="font-weight: 600; color: #0f172a;">Dr. ${record.doctorName || 'Clinical Specialist'}</span></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Organization:</strong> <span>PulsePoint Health Network</span></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Verification:</strong> <span style="color: #059669; font-weight: 700;">Verified Physician</span></p>
      </div>
    </div>

    <!-- Primary Diagnosis Banner -->
    <div style="background: linear-gradient(to right, #eff6ff, #f0fdf4); border: 1px solid #bfdbfe; padding: 16px 20px; border-radius: 12px; margin-bottom: 20px;">
      <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: #0369a1;">
        Primary Clinical Diagnosis & Assessment
      </p>
      <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0c4a6e;">
        ${record.diagnosis || 'General Health Consultation'}
      </h2>
    </div>

    <!-- Prescription / Medication -->
    ${record.prescription ? `
      <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; background-color: #ffffff;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
          <span style="font-family: 'Times New Roman', serif; font-size: 20px; font-weight: 800; color: #0284c7; font-style: italic;">Rx</span>
          <h4 style="margin: 0; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #334155; letter-spacing: 0.5px;">
            Prescribed Treatment & Medications
          </h4>
        </div>
        <p style="margin: 0; font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">
          ${record.prescription}
        </p>
      </div>
    ` : ''}

    <!-- Clinical Notes -->
    ${record.notes ? `
      <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; background-color: #ffffff;">
        <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #334155; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
          Clinical Observations & Directives
        </h4>
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">
          ${record.notes}
        </p>
      </div>
    ` : ''}

    <!-- Lab Results (if any) -->
    ${record.labResults ? `
      <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; background-color: #ffffff;">
        <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #334155; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
          Diagnostic Findings & Lab Values
        </h4>
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">
          ${record.labResults}
        </p>
      </div>
    ` : ''}

    <!-- Attachments Listing -->
    ${attachmentsHTML}

    <!-- Bottom Attestation & Signature -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 32px; border-top: 1px solid #cbd5e1; padding-top: 20px;">
      <div style="max-width: 440px;">
        <p style="color: #64748b; font-size: 9px; line-height: 1.5; margin: 0;">
          CONFIDENTIAL HEALTHCARE RECORD: This document contains protected health information generated by PulsePoint Clinical EHR. All diagnoses, prescriptions, and attachments are digitally sealed and verified. Unauthorized duplication or distribution is prohibited under applicable patient privacy standards.
        </p>
      </div>
      <div style="text-align: center; width: 200px;">
        <div style="height: 40px; border-bottom: 1px solid #94a3b8; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
          <span style="font-family: 'Georgia', serif; font-style: italic; font-size: 15px; color: #1e293b;">
            Dr. ${record.doctorName?.split(' ').pop() || 'Attending Physician'}
          </span>
        </div>
        <p style="color: #475569; font-size: 10px; font-weight: 700; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">
          Attending Physician Attestation
        </p>
        <p style="color: #94a3b8; font-size: 9px; margin: 1px 0 0 0;">Electronically Verified</p>
      </div>
    </div>
  `;

  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    const sanitizedDiagnosis = (record.diagnosis || 'Clinical_Record').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const dateStamp = record.date ? record.date.substring(0, 10) : new Date().toISOString().substring(0, 10);
    const fileName = `PulsePoint_Medical_Record_${sanitizedDiagnosis}_${dateStamp}.pdf`;
    
    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating Medical Record PDF:', error);
    throw error;
  } finally {
    document.body.removeChild(element);
  }
};

/**
 * Downloads a single medical attachment or document directly to the user's computer.
 * Works seamlessly across Edge, Chrome, Firefox, Safari, and web environments.
 */
export const downloadMedicalAttachment = async (
  attachment: MedicalAttachment | string, 
  customFilename?: string
): Promise<void> => {
  const url = typeof attachment === 'string' ? attachment : attachment.url;
  const fileName = customFilename || (typeof attachment === 'object' && attachment.name ? attachment.name : 'medical_document');

  if (!url) {
    console.error('No URL provided for attachment download');
    return;
  }

  // Case 1: Data URL (e.g. data:application/pdf;base64,... or data:image/png;base64,...)
  if (url.startsWith('data:')) {
    try {
      const arr = url.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      triggerBlobDownload(blob, fileName);
      return;
    } catch (err) {
      console.warn('Failed parsing data URL as blob, falling back to direct anchor download', err);
      triggerDirectAnchor(url, fileName);
      return;
    }
  }

  // Case 2: Blob URL
  if (url.startsWith('blob:')) {
    triggerDirectAnchor(url, fileName);
    return;
  }

  // Case 3: Remote HTTP / HTTPS URL
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }
    const blob = await response.blob();
    triggerBlobDownload(blob, fileName);
  } catch (fetchErr) {
    console.warn('Fetch with blob download failed (possibly CORS restricted), opening direct anchor fallback', fetchErr);
    triggerDirectAnchor(url, fileName);
  }
};

/**
 * Helper to download a Blob object in the browser
 */
function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(objectUrl);
  }, 1000);
}

/**
 * Helper to trigger an anchor download or target blank fallback
 */
function triggerDirectAnchor(href: string, filename: string) {
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = href;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
  }, 1000);
}

/**
 * Formats byte size into human readable string (e.g. 340 KB, 2.5 MB)
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Exports medical record summary as structured JSON document
 */
export const downloadMedicalRecordJSON = (record: MedicalRecord) => {
  const jsonString = JSON.stringify(record, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  triggerBlobDownload(blob, `Medical_Record_${record.id || 'export'}.json`);
};

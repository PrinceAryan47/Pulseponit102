import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MedicalRecord } from '../types';

interface PrescriptionPDFOptions {
  record: MedicalRecord;
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
}

export const downloadPrescriptionPDF = async ({
  record,
  patientName,
  patientAge = 'N/A',
  patientGender = 'N/A'
}: PrescriptionPDFOptions) => {
  const element = document.createElement('div');
  element.style.padding = '50px';
  element.style.width = '750px';
  element.style.backgroundColor = '#ffffff';
  element.style.color = '#1e293b';
  element.style.fontFamily = '"Inter", "Helvetica Neue", Arial, sans-serif';
  element.style.lineHeight = '1.6';

  const formattedDate = record.date 
    ? new Date(record.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString();

  element.innerHTML = `
    <!-- Header Letterhead -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="background-color: #0ea5e9; color: #ffffff; font-weight: 800; font-size: 18px; padding: 4px 10px; border-radius: 8px;">P+</span>
          <h1 style="color: #0ea5e9; font-size: 26px; font-weight: 800; margin: 0; tracking: -0.5px;">PulsePoint</h1>
        </div>
        <p style="color: #64748b; font-size: 11px; margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Smart Telehealth & Emergency Care Network</p>
      </div>
      <div style="text-align: right;">
        <p style="color: #1e293b; font-weight: 700; font-size: 13px; margin: 0;">OFFICIAL MEDICAL PRESCRIPTION</p>
        <p style="color: #64748b; font-size: 11px; margin: 2px 0 0 0;">Rx ID: <span style="font-family: monospace; font-weight: 600; color: #334155;">RX-${record.id?.toUpperCase().substring(0, 10) || 'N/A'}</span></p>
        <p style="color: #64748b; font-size: 11px; margin: 2px 0 0 0;">Date: ${formattedDate}</p>
      </div>
    </div>

    <!-- Details Section Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
      <!-- Patient Information -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px;">
        <h3 style="color: #0ea5e9; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Patient Demographics</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Name:</strong> <span style="font-weight: 600; color: #0f172a;">${patientName}</span></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Age:</strong> <span style="font-weight: 600; color: #0f172a;">${patientAge}</span></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Gender:</strong> <span style="font-weight: 600; color: #0f172a; text-transform: capitalize;">${patientGender}</span></p>
      </div>

      <!-- Prescriber Information -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px;">
        <h3 style="color: #0ea5e9; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Prescribing Practitioner</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Doctor:</strong> <span style="font-weight: 600; color: #0f172a;">Dr. ${record.doctorName || 'Licensed Specialist'}</span></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Facility:</strong> <span style="font-weight: 600; color: #0f172a;">PulsePoint Telehealth Network</span></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #475569;">Status:</strong> <span style="color: #10b981; font-weight: 700;">Verified Practitioner</span></p>
      </div>
    </div>

    <!-- Clinical Indication / Diagnosis -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px 20px; border-radius: 16px; margin-bottom: 30px;">
      <p style="margin: 0; font-size: 13px;"><strong style="color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Primary Indication / Clinical Diagnosis</strong></p>
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #14532d;">${record.diagnosis || 'General Advisory'}</p>
    </div>

    <!-- RX Title -->
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
      <span style="font-size: 32px; font-weight: 800; color: #0ea5e9; font-style: italic; font-family: 'Times New Roman', serif;">Rx</span>
      <div style="flex-grow: 1; border-bottom: 1px dashed #cbd5e1; height: 1px;"></div>
    </div>

    <!-- Prescription / Medication Details -->
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 28px; border-radius: 16px; min-height: 200px; margin-bottom: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
      <p style="font-size: 15px; color: #1e293b; font-weight: 500; white-space: pre-wrap; margin: 0; line-height: 1.8;">${record.prescription || 'No active medical substances prescribed.'}</p>
    </div>

    <!-- Signature and Footer -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 30px;">
      <div>
        <p style="color: #94a3b8; font-size: 10px; margin: 0; width: 380px; line-height: 1.5;">This digital prescription has been safely generated and signed electronically through PulsePoint Telehealth Platform under verified clinical standards. Please present this document at any certified partner pharmacy for fulfillment.</p>
      </div>
      <div style="text-align: center; width: 220px;">
        <div style="height: 48px; border-bottom: 1px solid #94a3b8; margin-bottom: 6px; display: flex; align-items: center; justify-content: center;">
          <span style="font-family: 'Georgia', serif; font-style: italic; font-size: 16px; color: #334155; opacity: 0.85;">Dr. ${record.doctorName?.split(' ').pop() || 'Specialist'}</span>
        </div>
        <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">Authorized Signature</p>
        <p style="color: #94a3b8; font-size: 10px; margin: 1px 0 0 0;">PulsePoint Digital Attestation</p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px;">
      <p style="margin: 0;">PulsePoint Support: support@pulsepoint.care • Telehealth Portal Record: Verified</p>
    </div>
  `;

  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    // Set format size of canvas.width, canvas.height to standard A4 (roughly 595 x 842 points)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2.5, canvas.height / 2.5],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2.5, canvas.height / 2.5);
    const fileName = `Rx_${record.doctorName?.replace(/\s+/g, '_') || 'PulsePoint'}_${record.id?.substring(0, 6) || Date.now()}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating Prescription PDF:', error);
  } finally {
    document.body.removeChild(element);
  }
};

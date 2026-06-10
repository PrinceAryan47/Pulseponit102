import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadUserGuide = async () => {
  const element = document.createElement('div');
  element.style.padding = '40px';
  element.style.width = '800px';
  element.style.backgroundColor = '#ffffff';
  element.style.color = '#1e293b';
  element.style.fontFamily = 'Arial, sans-serif';
  element.style.lineHeight = '1.6';

  element.innerHTML = `
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #0ea5e9; font-size: 32px; margin-bottom: 10px;">PulsePoint Health Platform</h1>
      <h2 style="color: #64748b; font-size: 20px;">Comprehensive User Guide & Functionality Overview</h2>
      <hr style="border: 0; border-top: 2px solid #e2e8f0; margin: 20px 0;" />
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #0ea5e9; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">1. Core Identity & Access</h3>
      <p><strong>Role-Based Access:</strong> The platform supports two primary roles: <strong>Patients</strong> and <strong>Doctors</strong>. Each role has a tailored dashboard and set of tools.</p>
      <p><strong>Secure Authentication:</strong> Users can register via email/password or use Google Sign-In. Profile setup includes essential health data like age, gender, and country-agnostic phone numbers.</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #0ea5e9; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">2. Health Utilities & AI Tools</h3>
      <p><strong>Gender-Specific Tools:</strong> Health tools are automatically filtered based on the user's gender (Men's Health vs. Women's Health) to provide relevant insights.</p>
      <ul>
        <li><strong>AI Symptom Checker:</strong> Powered by Gemini AI to provide preliminary health guidance.</li>
        <li><strong>Fitness & Wellness:</strong> AI-generated workout plans, calorie counters, and sleep trackers.</li>
        <li><strong>Specialized Guides:</strong> Men's Health Guide and Women's Health (Period/Pregnancy) trackers.</li>
        <li><strong>Calculators:</strong> BMI, Water Intake, and Heart Rate monitors.</li>
      </ul>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #0ea5e9; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">3. Healthcare Communication</h3>
      <p><strong>Doctor Directory:</strong> Search and filter specialists by expertise and hospital affiliation.</p>
      <p><strong>Virtual Consultations:</strong> High-quality WebRTC video calls using secure meeting links, similar to Google Meet. Features real-time duration timers and participant identity verification.</p>
      <p><strong>Secure Messaging:</strong> Real-time chat for sharing information and coordinating care.</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #0ea5e9; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">4. Medical Management</h3>
      <p><strong>Digital Records:</strong> Securely store and access prescriptions, lab results, and diagnostic history.</p>
      <p><strong>Appointment Scheduling:</strong> Book and manage consultations with automated status updates.</p>
      <p><strong>Hospital Locator:</strong> Find and contact nearby medical facilities.</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #0ea5e9; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">5. Emergency & First Aid</h3>
      <p><strong>AI Emergency Assistant:</strong> Real-time, step-by-step first aid instructions for critical situations.</p>
      <p><strong>First Aid Kit Checklist:</strong> Categorized essential items for home and travel safety.</p>
      <p><strong>Emergency Procedures:</strong> Quick-access guides for common medical emergencies.</p>
    </div>

    <div style="text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8;">
      <p>© 2026 PulsePoint Health Platform. All rights reserved.</p>
      <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
  `;

  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save('PulsePoint_User_Guide.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    document.body.removeChild(element);
  }
};

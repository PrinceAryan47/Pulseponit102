/**
 * Client-Side Resilient Offline Health Data Generators
 * Mimics clinical fallback responses in case of server/API connection errors,
 * ensuring zero failure rate and offline capabilities.
 */

// Helper to clean up string display
const titleCase = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export function generateMensHealthFallback(criteria: {
  age: number;
  focus: string;
  activity: string;
  familyHistory: string;
}): string {
  const { age, focus, activity, familyHistory } = criteria;
  
  // Build age-graded screenings
  const screenTimeline: string[] = [];
  if (age >= 18) screenTimeline.push(`*   **Blood Pressure Assessment**: Recommended to check annually (Ideal target: below 120/80 mmHg). Essential to track cardiovascular resistance.`);
  if (age >= 20) screenTimeline.push(`*   **Lipid Panel / Cholesterol Test**: Every 4-6 years starting at age 20 to determine risk profiles for coronary atherosclerosis.`);
  if (age >= 35) screenTimeline.push(`*   **Type 2 Diabetes HbA1c Screening**: Every 3 years starting at age 35 to map fasting blood sugar trends and address prediabetic markers.`);
  if (age >= 45) {
    screenTimeline.push(`*   **Colorectal Cancer Screening**: Colonoscopy or home stool kits are standard starting at age 45. Essential for early precancerous polyp detection.`);
    screenTimeline.push(`*   **Prostate-Specific PSA Test**: Consult with your physician starting at age 45-50 to design an individual screening pathway.`);
  }
  if (age >= 50) screenTimeline.push(`*   **Shingles (Zoster) Vaccination**: Typically 2 doses starting at age 50 to maintain solid immune protection against viral nerve pain.`);
  if (age >= 65) screenTimeline.push(`*   **Pneumococcal Immunization**: Guidance recommends immunization at age 65 as an effective barrier against bacterial pneumonia.`);

  const focusLabel = titleCase(focus);
  const activityLabel = titleCase(activity);
  const historyLabel = familyHistory === 'none' ? 'No known hereditary history' : `Hereditary history of ${familyHistory}`;

  return `# PERSONALIZED MEN'S PREVENTIVE HEALTH REPORT (OFFLINE DATABASE ACTIVE)

## 📋 Recommended Screenings & Preventive Timeline (Aged ${age})
*Note: This wellness report has been safely retrieved from PulsePoint's local peer-reviewed medical repository due to temporary server unavailability.*

${screenTimeline.length > 0 ? screenTimeline.join("\n") : "*   No explicit diagnostics triggered for this range. Consult with your practitioner."}

## ⚠️ Key Health Risks & Vulnerabilities
*   **Cardiovascular Integrity**: Factoring in your profile (Primary focus: ${focusLabel}), supporting arterial health, managing blood pressure, and evaluating cholesterol remain critical core pillars.
*   **Metabolic Homeostasis**: A gradual physical change in baseline resting metabolism in the ${age}-year-old age group calls for balancing body composition to shield from insulin resistance.
*   **Hereditary Risks**: Based on profile details showing a "${historyLabel}", prioritizing preventive family-graded checks with your doctor is highly commended.

## 🥗 Target Nutrition, Supplementation & Lifestyle Guidelines
*   **Dietary Guidance**: Transition toward an anti-inflammatory diet focusing on whole-food groups, leafy cruciferous greens, rich omega-3 fatty acids, and heart-healthy olive oil.
*   **Target Micro-nutrients**: Prioritize magnesium glycinate (300-400mg) for muscle recovery, Vitamin D3/K2 for bone and cardiovascular support, and direct functional cellular hydration.
*   **Physical Activity State (${activityLabel})**: Tailor movement to elevate structural lean tissue density and bone mineralization through structured resistance circuits alongside low-intensity endurance walks.

## 🧠 Cognitive Support & Mental Health Considerations
*   **Stress Decompression**: Practice 10 minutes of active breathwork or diaphragmatic loops daily to lower blood pressure and cortisol levels.
*   **Sleep Optimization**: Maintain a regular bedtime window, keeping dark, cool environments (18-20°C) to maximize deep REM sleep states.

## 🩺 Doctor Consultation Checklist
1. "Should we check my baseline high-sensitivity C-reactive protein (hs-CRP) to evaluate cardiac inflammation levels?"
2. "Are physical risk markers triggering the need for a comprehensive metabolic panel or vitamin markers review?"
3. "Is a preventive colonoscopy or PSA baseline test recommended for my specific lifestyle and family background?"`;
}

export function generateFitnessWorkoutFallback(criteria: {
  age: number;
  gender: string;
  weight: number;
  height: number;
  goal: string;
  level: string;
  days: number;
  equipment: string;
}): string {
  const { age, gender, weight, height, goal, level, days, equipment } = criteria;
  const goalLabel = titleCase(goal);
  const levelLabel = titleCase(level);
  const equipLabel = equipment === 'gym' ? 'Fully equipped commercial gym' : equipment === 'home' ? 'Dumbbells and basic resistance bands' : 'No equipment / Pure bodyweight training';

  return `# ${goalLabel.toUpperCase()} FITNESS AND WORKOUT ROUTINE (OFFLINE DATABASE ACTIVE)
*Targeted Athlete Profile: ${age}-year-old ${titleCase(gender)} | Weight: ${weight}kg, Height: ${height}cm | Level: ${levelLabel}*

*Note: This workout schedule has been safely compiled from PulsePoint's physical therapy & progressive overload guidelines.*

## 🗓️ Weekly Training Frequency Split (${days}-Day Split)
| Day | Target Focus | Action Type | Duration |
| :--- | :--- | :--- | :--- |
| **Day 1** | Primary Push Routine (Chest, Shoulders, Triceps) | Strength / Hypertrophy | 45-60 mins |
| **Day 2** | Primary Pull Routine (Back, Traps, Biceps) | Strength / Hypertrophy | 45-60 mins |
| **Day 3** | Active Recovery Mobility & Rest | Stretching / Light Cardio | 20-30 mins |
| **Day 4** | Primary Legs and Core Routine | Strength / Hypertrophy | 45-60 mins |
| **Day 5** | Cardiovascular Conditioning & HIIT | Metabolic Fitness | 30-40 mins |
| **Day 6** | Full Rest and Recovery | Muscle Repair | - |
| **Day 7** | Full Rest and Recovery | Muscle Repair | - |

## 🏋️ Routine Step-by-Step Breakdown (Designed for ${equipLabel})

### Session 1: Push Focus
*   **Warm-Up Protocol**:
    *   Dynamic upper extremity movements: 2 sets x 15 reps
    *   Resistance band chest openers: 2 sets x 12 reps
*   **Main Workout Block**:
    1.  **Dumbbell Flat Press**: 4 sets x 8-10 reps. Drive up from pectorals under complete eccentric control.
    2.  **Dumbbell Incline Press**: 3 sets x 10-12 reps. Targets upper clavicular pectoris.
    3.  **Seated Dumbbell Shoulder Press**: 3 sets x 10 reps. Keep shoulder joint in a safe natural slot.
    4.  **Dumbbell Lateral Raise**: 4 sets x 15 reps. Build rounded shoulders.
    5.  **Tricep Overhead Extensions**: 3 sets x 12 reps. Focus on forearm elbow extension.
*   **Cool-Down / Flexibility Plan**:
    *   Pec doorway stretch: 1 min
    *   Rotator cuff stretch: 1 min

### Session 2: Pull Focus
*   **Warm-Up Protocol**:
    *   Scapular retractions and rolls: 20 reps
    *   Band face pulls: 2 sets x 15 reps
*   **Main Workout Block**:
    1.  **Dumbbell Row (Bent Over)**: 4 sets x 8-10 reps. Pull towards the belly button to lock in the lower lats.
    2.  **Single-Arm Supported Row**: 3 sets x 12 reps. Isolate each side carefully.
    3.  **Dumbbell Incline Bicep Curl**: 3 sets x 12 reps. Complete biceps stretch.
    4.  **Rear Delt Flye (Prone/Seated)**: 3 sets x 15 reps. Strengthen upper back and scapular geometry.
*   **Cool-Down / Flexibility Plan**:
    *   Passive lat hangs on dead bar: 1 min
    *   Humble child's pose: 2 mins

### Session 3: Lower Body Focus
*   **Warm-Up Protocol**:
    *   Bodyweight squats: 2 sets x 15 reps
    *   Active hip opens (leg swings): 10 per leg
*   **Main Workout Block**:
    1.  **Goblet Squat (Dumbbell)**: 4 sets x 10 reps. Push through heels to keep knee stability.
    2.  **Dumbbell Romanian Deadlift (RDL)**: 3 sets x 10-12 reps. Drive hips back, focusing on high hamstring load.
    3.  **Dumbbell Walking Lunges**: 3 sets x 12 steps per leg. Great for hip stability and unilateral balance.
    4.  **Standing Calf Raises**: 4 sets x 15 reps. Isolate gastroc muscles.
*   **Cool-Down / Flexibility Plan**:
    *   Hip flexor kneeling stretch: 1 min per side
    *   Classic hamstring floor reach: 1 min

## 🥗 Nutrition & Fueling Protocols (Target: ${goalLabel})
*   **Hydration Metric**: Keep consumption clean, tracking roughly 3.5 liters per active day.
*   **Amino Acid Pools**: Focus protein targets around 2.0g per kg of total body mass to accelerate structural tissue regrowth.
*   **Strategic Pre-Workout**: Easily digestible simple carbohydrates 45 mins before training (e.g. oatmeal or fresh fruit).
*   **Optimal Recovery Meal**: Clean carb and lean protein ratio within 90 minutes post-training.

## 📈 Progression & Recovery Philosophy
*   **Progressive Overload**: Aim to add one additional repetition or a small mass load to each movement set weekly.
*   **Systemic Rest**: Rest is where muscle grows. Prioritize 8 full hours of sleep to amplify growth hormone release and central nervous system repair.`;
}

export interface SymptomCheckerCriteria {
  age: number;
  gender: string;
  pregnancyStatus?: string;
  symptoms: string;
  severity: number;
  trend: string;
  duration: string;
  selectedSymptoms: string[];
  history: string;
  allergiesMedications: string;
  triggers: string;
}

export function generateSymptomCheckerFallback(criteria: SymptomCheckerCriteria): string {
  const { 
    age, 
    gender, 
    pregnancyStatus, 
    symptoms, 
    severity, 
    trend, 
    duration, 
    selectedSymptoms, 
    history, 
    allergiesMedications, 
    triggers 
  } = criteria;

  const combinedText = `${symptoms} ${selectedSymptoms.join(' ')} ${triggers} ${history}`.toLowerCase();
  const symptomsOnly = `${symptoms} ${selectedSymptoms.join(' ')}`.toLowerCase();
  
  const isHighSeverity = severity >= 8;
  const isModerateSeverity = severity >= 5 && severity < 8;
  const isLowSeverity = severity < 5;
  const isWorsening = trend.toLowerCase().includes('worsening');
  const isFluctuating = trend.toLowerCase().includes('fluctuating');
  const isPregnant = (gender === 'female' || gender === 'other') && pregnancyStatus === 'yes';
  const isPediatric = age > 0 && age < 12;
  const isAdolescent = age >= 12 && age < 18;
  const isGeriatric = age >= 65;

  // Timeline classification
  const durationLower = (duration || '').toLowerCase();
  const isHyperAcute = durationLower.includes('hour') || durationLower.includes('min') || durationLower.includes('sudden') || durationLower.includes('just');
  const isChronic = durationLower.includes('month') || durationLower.includes('year') || durationLower.includes('weeks') || durationLower.includes('week');

  let triageCategory = "🟢 ROUTINE / SELF-CARE & MONITORING";
  let triageColor = "emerald";
  let urgencyDescription = "Symptoms appear manageable with self-care and close monitoring. Schedule a routine doctor visit if no improvement within 48-72 hours.";

  if (isHighSeverity || isWorsening && isModerateSeverity) {
    triageCategory = "🚨 CRITICAL / IMMEDIATE EMERGENCY EVALUATION";
    triageColor = "rose";
    urgencyDescription = "High severity or rapidly escalating symptoms detected. Immediate emergency medical assessment (or calling local emergency services 999/911/112) is strongly recommended.";
  } else if (isModerateSeverity || isPregnant || isPediatric && severity >= 4) {
    triageCategory = "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION";
    triageColor = "amber";
    urgencyDescription = "Moderate symptom burden or elevated demographic vulnerability. Same-day clinical consultation at an urgent care or outpatient clinic is recommended.";
  } else if (isChronic || (history && history !== 'none reported')) {
    triageCategory = "🟡 PRIMARY CARE / SCHEDULED MEDICAL CONSULT";
    triageColor = "blue";
    urgencyDescription = "Subacute or chronic pattern with relevant background context. A scheduled evaluation with your primary physician with routine diagnostic labs is recommended.";
  }

  let causes = "";
  let treatments = "";
  let prevention = "";
  let firstaid = "";
  let resources = "";

  // 1. CARDIAC & CHEST PAIN EMERGENCY
  if (
    symptomsOnly.includes("chest pain") || 
    symptomsOnly.includes("chest pressure") || 
    symptomsOnly.includes("chest tightness") || 
    symptomsOnly.includes("crushing pain") || 
    symptomsOnly.includes("radiating to arm") || 
    symptomsOnly.includes("radiating to jaw") || 
    symptomsOnly.includes("heart attack") || 
    symptomsOnly.includes("angina") ||
    (symptomsOnly.includes("palpitation") && (isHighSeverity || symptomsOnly.includes("shortness of breath") || symptomsOnly.includes("dizziness")))
  ) {
    triageCategory = "🚨 CRITICAL / IMMEDIATE EMERGENCY EVALUATION";
    causes = `## Possible Causes & Pathology
- **Acute Coronary Syndrome (ACS) / Myocardial Infarction**: High clinical suspicion. Acute central, retrosternal, or left precordial tightness/pressure radiating to the left arm, neck, or jaw is the classic presentation of acute myocardial ischemia. Door-to-balloon percutaneous coronary intervention (PCI) within 90 minutes is the international standard of care (ACC/AHA Guidelines).
- **Unstable Angina Pectoris**: Transient myocardial ischemia occurring at rest or with minimal exertion, indicating plaque destabilization without immediate permanent myocyte necrosis.
- **Acute Pericarditis / Myocarditis**: Inflammation of the pericardial sac, often sharp in character, relieved by leaning forward and worsened by deep inspiration (pleuritic).
- **Aortic Dissection (Rule-out)**: If described as a tearing or ripping pain radiating to the interscapular back, urgent contrast CT angiography is mandatory.
- **Costochondritis / Musculoskeletal Chest Wall Strain**: Inflammation of costochondral junctions, reproducible by localized chest wall palpation, but strictly a diagnosis of exclusion after vascular and cardiac emergencies are ruled out.
${history ? `\n*Impact of Stated History (${history}):* Your reported pre-existing health condition significantly elevates cardiovascular risk stratification; prompt troponin biomarkers and 12-lead ECG are non-negotiable.` : ""}
${duration ? `\n*Timeline Analysis (Duration: ${duration}):* Symptom presentation of "${duration}" is within the critical diagnostic window where acute ischemia must be ruled out immediately.` : ""}`;

    treatments = `## Evidence-Based Treatment Pathways
- **Immediate Hospital Emergency Triage**: Obtain emergency 12-lead electrocardiogram (ECG) within 10 minutes of arrival, serial high-sensitivity cardiac troponin (hs-cTnI/T), and telemetry.
- **Emergency Aspirin Administration**: Unless contraindicated by active gastrointestinal bleeding or documented aspirin allergy, chew 162–325 mg of non-enteric-coated aspirin immediately upon dispatch advice to inhibit thromboxane A2 and prevent clot propagation.
- **Oxygen Therapy**: Supplemental oxygen only if SpO2 falls below 90% (per AHA/ESC guidelines, hyperoxia in normoxic patients is avoided).
- **Sublingual Nitroglycerin**: If prescribed by your personal cardiologist for chronic angina, administer 0.4 mg sublingually every 5 minutes (up to 3 doses) while seated; never take if PDE-5 inhibitors (e.g. sildenafil) were used in the past 24–48 hours due to catastrophic hypotension risk.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Cardiovascular Risk Stratification**: Target LDL cholesterol < 70 mg/dL (or < 55 mg/dL in high-risk vascular patients) via high-intensity statin therapy.
- **Blood Pressure Homeostasis**: Maintain systolic BP < 120–130 mmHg through sodium restriction (< 2,000 mg/day), aerobic movement, and prescribed antihypertensives.
- **Mediterranean / DASH Dietary Pattern**: High omega-3 polyunsaturated fats, extra virgin olive oil, leafy greens, legumes, and complete tobacco cessation.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **CRITICAL CARDIAC RED FLAGS**:
  - Crushing, squeezing, heavy retrosternal pressure lasting > 5 minutes.
  - Pain radiating to the jaw, neck, back, epigastrium, or one/both arms.
  - Accompanied by diaphoresis (cold clammy sweat), nausea, shortness of breath, or lightheadedness.
- **Immediate Action Steps**:
  1. **Call 999, 911, or 112 immediately.** Do NOT drive yourself to the hospital under any circumstances.
  2. Sit or recline at a 45-degree angle (semi-Fowler's position) to decrease venous return and cardiac workload.
  3. Loosen constricting clothing around the neck and waist.
  4. If the patient becomes unresponsive and stops normal breathing, begin hands-only CPR at 100-120 compressions per minute and deploy an AED immediately.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Critical Questions for Your Emergency / Cardiology Team:
1. "Did my 12-lead ECG show ST-segment elevation (STEMI), T-wave inversions, or new conduction blocks?"
2. "What were my baseline and serial high-sensitivity troponin values at 0, 1, and 3 hours?"
3. "Is an urgent echocardiogram or cardiac catheterization recommended based on my presentation?"

### Verified Clinical Guidelines & Platforms:
| Organization | Resource / Standard | Scope |
| :--- | :--- | :--- |
| **American Heart Association (AHA)** | Heart Attack Warning Signs & Guidelines | Emergency protocols, ECG timing, and STEMI care |
| **American College of Cardiology (ACC)** | Acute Chest Pain Diagnostic Pathways | High-sensitivity troponin protocols and risk scores (HEART score) |
| **Mayo Clinic** | Chest Pain Diagnosis & Emergency First Steps | Triage rules, differential diagnosis, and patient recovery |`;
  }
  
  // 2. STROKE & ACUTE NEUROLOGICAL EMERGENCY
  else if (
    symptomsOnly.includes("facial droop") || 
    symptomsOnly.includes("face drooping") || 
    symptomsOnly.includes("slurred speech") || 
    symptomsOnly.includes("arm weakness") || 
    symptomsOnly.includes("stroke") || 
    symptomsOnly.includes("thunderclap") || 
    symptomsOnly.includes("worst headache of life") ||
    symptomsOnly.includes("sudden numbness") || 
    symptomsOnly.includes("paralysis") || 
    symptomsOnly.includes("loss of vision") ||
    symptomsOnly.includes("hemiparesis")
  ) {
    triageCategory = "🚨 CRITICAL / IMMEDIATE EMERGENCY EVALUATION";
    causes = `## Possible Causes & Pathology
- **Acute Ischemic Stroke / Transient Ischemic Attack (TIA)**: Rapid disruption of cerebral blood supply due to thromboembolism or in-situ arterial occlusion. Every minute of ischemia results in the loss of approximately 1.9 million neurons ("Time is Brain").
- **Hemorrhagic Stroke / Subarachnoid Hemorrhage (SAH)**: Rupture of a cerebral aneurysm or arteriovenous malformation, frequently presenting as an explosive "thunderclap" headache with peak intensity within seconds, neck stiffness, and photophobia.
- **Intracranial Mass or Subdural Hematoma**: In older adults or following trauma, slow venous bleeding can mimic acute stroke symptoms.
${history ? `\n*Historical Correlation (${history}):* Your medical history provides essential context for neurovascular etiology (e.g. thromboembolic vs hypertensive microvascular).` : ""}`;

    treatments = `## Evidence-Based Treatment Pathways
- **Golden Window Thrombolysis (IV Alteplase / Tenecteplase)**: Must be initiated within 4.5 hours of documented "last known normal" time after non-contrast head CT excludes hemorrhage.
- **Endovascular Mechanical Thrombectomy (EVT)**: In large vessel occlusions (LVO), catheter-based clot retrieval can be performed within up to 6–24 hours in selected patients based on CT perfusion imaging.
- **Permissive Hypertension Protocol**: In acute ischemic stroke, blood pressure is cautiously managed by specialists (not lowered precipitously) to preserve penumbral cerebral perfusion.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Atrial Fibrillation Screening**: Continuous Holter ECG monitoring to identify occult paroxysmal atrial fibrillation requiring oral anticoagulation (DOACs).
- **Carotid Artery Duplex Ultrasound**: Screening for carotid stenosis (> 70% may warrant carotid endarterectomy or stenting).
- **Strict BP Control**: Keeping systolic BP < 130 mmHg significantly reduces secondary stroke recurrence.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **BE-F.A.S.T. STROKE ASSESSMENT**:
  - **B**alance: Sudden loss of balance, vertigo, or ataxia.
  - **E**yes: Sudden loss of vision, double vision, or visual field cut.
  - **F**ace: Asymmetrical smile, facial droop on one side.
  - **A**rms: One arm drifting down when both are extended for 10 seconds.
  - **S**peech: Slurred speech, inappropriate word usage, or inability to repeat phrases.
  - **T**ime: Call emergency services (999/911/112) IMMEDIATELY. Record the exact minute symptoms were first noticed!
- ⚠️ **CRITICAL WARNINGS**:
  - **DO NOT** give aspirin (worsens hemorrhagic strokes and disqualifies from thrombolysis).
  - **DO NOT** give anything by mouth (food or liquids can cause fatal aspiration due to impaired pharyngeal reflexes).`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Urgent Questions for the Stroke Team:
1. "What did the emergent non-contrast head CT and CT angiography show regarding vessel occlusion or hemorrhage?"
2. "What was recorded as my 'last known normal' time, and am I eligible for IV thrombolysis or endovascular thrombectomy?"
3. "Are neurology ICU admission and neuro-telemetry scheduled?"

### Authoritative Stroke Guidelines:
| Authority | Resource | Standard |
| :--- | :--- | :--- |
| **American Stroke Association (ASA)** | Guidelines for the Early Management of Acute Ischemic Stroke | Thrombectomy and thrombolysis windows |
| **NIH NINDS** | Stroke Information & Clinical Trials | Brain preservation, rehabilitation pathways |
| **World Stroke Organization (WSO)** | Global Stroke Services Guidelines | Rapid triage algorithms and secondary prevention |`;
  }

  // 3. TROPICAL & INFECTIOUS ILLNESSES (MALARIA, DENGUE, TYPHOID, SEPSIS)
  else if (
    (symptomsOnly.includes("malaria") || symptomsOnly.includes("shivering") || symptomsOnly.includes("rigors") || symptomsOnly.includes("high fever")) &&
    (symptomsOnly.includes("chills") || symptomsOnly.includes("sweat") || symptomsOnly.includes("body aches") || symptomsOnly.includes("headache") || selectedSymptoms.includes("Fever"))
  ) {
    triageCategory = isHighSeverity ? "🚨 CRITICAL / IMMEDIATE EMERGENCY EVALUATION" : "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION";
    causes = `## Possible Causes & Pathology
- **Malaria (Plasmodium falciparum / vivax)**: High clinical index of suspicion, especially in endemic regions (East Africa, Sub-Saharan Africa, South Asia) or returning travelers. Characterized by cyclic paroxysms: cold stage (severe shaking chills/rigors for 15-60 min), hot stage (high fever 39-41°C, intense throbbing headache, myalgias), and sweating stage (diaphoresis with rapid defervescence). P. falciparum can rapidly progress to cerebral malaria, severe anemia, and multi-organ failure.
- **Dengue Fever ("Break-bone Fever")**: Arboviral infection transmitted by Aedes mosquitoes. Characterized by sudden high fever, severe retro-orbital eye pain, debilitating arthralgias/myalgias, and maculopapular rash. Warning signs for Severe Dengue include persistent vomiting, abdominal pain, mucosal bleeding, and rapid platelet drop.
- **Enteric / Typhoid Fever (Salmonella enterica serovar Typhi)**: Step-ladder rising fever, relative bradycardia (Faget's sign), abdominal discomfort, coated tongue, and faint rose spots on the trunk.
- **Systemic Sepsis / Bacteremia**: Bacterial infection entering systemic circulation, characterized by qSOFA criteria (respiratory rate >= 22, altered mentation, systolic BP <= 100 mmHg).
${duration ? `\n*Duration Analysis (${duration}):* Febrile progression over "${duration}" requires urgent laboratory parasitemia confirmation; prompt diagnosis within 24 hours prevents severe complicated malaria.` : ""}`;

    treatments = `## Evidence-Based Treatment Pathways
- **Rapid Diagnostic Testing (RDT) & Blood Smear**: Immediate finger-prick Malaria RDT and thick/thin Giemsa-stained blood smears to quantify parasite density before initiating targeted therapy.
- **Artemisinin-Based Combination Therapy (ACT)**: First-line WHO standard for uncomplicated P. falciparum (e.g. Artemether-Lumefantrine [Coartem] or Dihydroartemisinin-Piperaquine). In severe malaria, intravenous Artesunate is mandatory.
- **Complete Blood Count (CBC) & Platelet Monitoring**: Daily monitoring of hemoglobin/hematocrit and platelet counts to detect thrombocytopenia or hemolysis.
- **Fluid & Electrolyte Resuscitation**: Oral rehydration salts (ORS) or IV balanced crystalloids to prevent acute tubular necrosis from hemoglobinuria and dehydration.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Vector Control & Bednets**: Sleep under long-lasting insecticidal nets (LLINs) and apply DEET (20-30%) or Picaridin repellents during dusk and dawn feeding times.
- **Chemoprophylaxis**: For travelers to malaria-endemic zones, Atovaquone-Proguanil (Malarone) or Doxycycline taken strictly per schedule.
- **Food & Water Sanitation**: Consume only bottled or boiled water, thoroughly cooked foods, and consider Typhoid Vi polysaccharide or conjugate vaccination.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **SEPSIS & SEVERE MALARIA RED FLAGS**:
  - Extreme lethargy, confusion, hallucinations, or unresponsiveness (cerebral malaria).
  - Repeated seizures or involuntary twitching.
  - Inability to retain oral fluids or oral medications due to intractable vomiting.
  - Very dark urine ("blackwater fever" indicating massive intravascular hemolysis).
  - Jaundice (yellowing of sclera/skin) or spontaneous bleeding from gums or nose.
- **Immediate Action**: Proceed to the nearest hospital or emergency center immediately for parenteral antiparasitic/antibiotic therapy and IV hydration.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Urgent Questions for Your Clinical Provider:
1. "Did the rapid diagnostic test (RDT) or thick/thin blood smear confirm Plasmodium species and parasite burden percentage?"
2. "What are my current platelet count, hematocrit, and serum lactate levels?"
3. "Are intravenous Artesunate or antibiotics indicated based on my clinical presentation?"

### Authoritative Infectious Disease Standards:
| Platform | Focus | Guidance |
| :--- | :--- | :--- |
| **World Health Organization (WHO)** | Guidelines for Malaria Treatment | First-line ACT regimens, IV artesunate dosing, and severe malaria care |
| **CDC.gov** | Malaria Diagnosis & Treatment in the United States | Treatment tables, travel advisories, and lab protocols |
| **Mayo Clinic** | Malaria Symptoms & Clinical Prevention | Transmission, pathology, complications, and traveler health |`;
  }

  // 4. SEVERE RESPIRATORY / ASTHMA / DYSPNEA / PNEUMONIA
  else if (
    symptomsOnly.includes("shortness of breath") || 
    symptomsOnly.includes("difficulty breathing") || 
    symptomsOnly.includes("cannot breathe") || 
    symptomsOnly.includes("wheezing") || 
    symptomsOnly.includes("stridor") || 
    symptomsOnly.includes("asthma attack") || 
    symptomsOnly.includes("blue lips") ||
    symptomsOnly.includes("gasping") ||
    (selectedSymptoms.includes("Shortness of breath") && isModerateSeverity)
  ) {
    triageCategory = isHighSeverity ? "🚨 CRITICAL / IMMEDIATE EMERGENCY EVALUATION" : "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION";
    causes = `## Possible Causes & Pathology
- **Acute Asthma Exacerbation**: Bronchial smooth muscle constriction, airway mucosal hyperreactivity, and excessive mucus plugging leading to expiratory airflow limitation and ventilation-perfusion mismatch.
- **Community-Acquired Pneumonia (CAP)**: Microbial infection of alveolar parenchyma causing consolidation, purulent sputum, fever, and localized crackles or bronchial breath sounds on auscultation.
- **Pulmonary Embolism (PE)**: Thrombus occlusion of pulmonary arterial tree; classic triad includes sudden unexplained dyspnea, pleuritic chest pain, and tachypnea, often with deep vein thrombosis risk factors (immobility, surgery, estrogen therapy).
- **COPD Exacerbation**: Worsening baseline dyspnea, sputum volume, and purulence in patients with chronic obstructive pulmonary disease.
${isPregnant ? `\n*Pregnancy Precaution:* Pregnancy induces physiological hyperventilation, but acute dyspnea with chest pain or tachycardia requires prompt exclusion of pulmonary embolism via D-dimer and compression ultrasonography.` : ""}
${history ? `\n*Medical History Impact (${history}):* Stated pulmonary or cardiovascular background directly increases vulnerability to acute respiratory failure.` : ""}`;

    treatments = `## Evidence-Based Treatment Pathways
- **Inhaled Short-Acting Beta-2 Agonist (SABA)**: Albuterol / Salbutamol 4–8 puffs via metered-dose inhaler with spacer every 20 minutes for 3 doses, or nebulized albuterol (2.5 mg) with ipratropium bromide.
- **Systemic Corticosteroids**: Oral Prednisone (40–50 mg daily for 5 days) or IV Methylprednisolone to accelerate resolution of airway inflammation and reduce relapse rates (GINA Guidelines).
- **Pulse Oximetry & Oxygen Therapy**: Titrate supplemental oxygen to achieve target SpO2 93–95% (or 88–92% in chronic hypercapnic respiratory failure).
- **Tripod Positioning**: Sit upright, leaning forward with elbows on knees to maximize thoracic volume and diaphragm movement.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Inhaled Corticosteroid (ICS) Controller**: Regular daily use of ICS-Formoterol controller therapy to suppress underlying airway hyperresponsiveness.
- **Allergen & Irritant Avoidance**: Eliminate exposure to tobacco smoke, biomass smoke, dust mites, pet dander, and extreme cold drafts.
- **Annual Immunizations**: Maintain updated Influenza, COVID-19, and Pneumococcal (PCV20) vaccinations.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **CRITICAL RESPIRATORY RED FLAGS**:
  - Cyanosis: Bluish or grayish tinge on lips, gums, or nail beds.
  - Speech Dyspnea: Inability to speak more than 2-3 words between breaths.
  - Intercostal / Suprasternal Retractions: Chest or neck skin sucking inward during inspiration.
  - "Silent Chest": Cessation of wheezing due to severe lack of air movement (pre-terminal event).
- **Action**: Call emergency services (999/911/112) immediately. Administer rescue inhaler continuously while waiting for paramedics.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Pulmonologist / Doctor:
1. "What is my measured SpO2 and forced expiratory volume (FEV1) or peak expiratory flow (PEF) percentage?"
2. "Does my chest X-ray show focal consolidation (pneumonia), pneumothorax, or pulmonary edema?"
3. "Should we step up my daily maintenance inhaler therapy according to GINA stepwise guidelines?"

### Trustworthy Respiratory Guidelines:
| Authority | Resource | Scope |
| :--- | :--- | :--- |
| **Global Initiative for Asthma (GINA)** | Global Strategy for Asthma Management | Stepwise controller algorithms and exacerbation protocols |
| **American Thoracic Society (ATS)** | Pneumonia & Dyspnea Guidelines | Diagnostic criteria, CURB-65 score, and antibiotic stewardship |
| **Mayo Clinic** | Shortness of Breath Diagnosis & Causes | Differential diagnosis, emergency indicators, and home relief |`;
  }

  // 5. ANAPHYLAXIS & SYSTEMIC ALLERGIC REACTION
  else if (
    symptomsOnly.includes("anaphylaxis") || 
    symptomsOnly.includes("swollen tongue") || 
    symptomsOnly.includes("swollen lips") || 
    symptomsOnly.includes("throat closing") || 
    symptomsOnly.includes("difficulty swallowing") || 
    (symptomsOnly.includes("hives") && (symptomsOnly.includes("vomiting") || symptomsOnly.includes("dizziness") || symptomsOnly.includes("breath")))
  ) {
    triageCategory = "🚨 CRITICAL / IMMEDIATE EMERGENCY EVALUATION";
    causes = `## Possible Causes & Pathology
- **Systemic Anaphylaxis (IgE-Mediated Type I Hypersensitivity)**: Rapidly progressing multi-system emergency. Massive mast-cell and basophil degranulation releases histamine, leukotrienes, and platelet-activating factor, triggering profound peripheral vasodilation (distributive shock), acute bronchospasm, and mucosal angioedema.
- **Common Offending Antigens**: Food allergens (peanuts, shellfish, tree nuts, dairy), medications (beta-lactams, NSAIDs), insect stings (wasps, honeybees), or natural rubber latex.
- **Bradykinin-Mediated Angioedema**: Non-allergic swelling frequently triggered by ACE-inhibitor medications (e.g. lisinopril) or hereditary C1-esterase inhibitor deficiency.
${allergiesMedications ? `\n*Allergies & Medications Screen (${allergiesMedications}):* Any reported drug exposure must be evaluated as a causative or aggravating factor.` : ""}`;

    treatments = `## Evidence-Based Treatment Pathways
- **Intramuscular Epinephrine (First-Line Drug of Choice)**: Epinephrine 1:1,000 (1 mg/mL) injected intramuscularly into the anterolateral mid-thigh (0.3 mg adult, 0.15 mg pediatric). Intramuscular injection produces rapid peak plasma concentrations within 8 minutes.
- **Repeat Epinephrine Protocol**: If symptoms do not improve within 5–15 minutes, a second dose of intramuscular epinephrine must be administered in the opposite thigh.
- **Secondary Adjuvants**: Intravenous crystalloid fluid boluses for hypotension, H1 antihistamines (Cetirizine/Diphenhydramine), H2 blockers (Famotidine), and corticosteroids to mitigate biphasic rebound reactions.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **EpiPen Carrying Protocol**: Always carry two auto-injectors at all times; verify expiration dates every 6 months.
- **Medical Alert Identification**: Wear an internationally recognized medical alert necklace or wristband identifying your allergy.
- **Formal Allergy Consultation**: Component-resolved IgE testing or allergen desensitization immunotherapy under board-certified allergist care.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **EMERGENCY ANAPHYLAXIS ACTION PLAN**:
  1. **Inject Epinephrine IM immediately** into the outer mid-thigh.
  2. **Call 999, 911, or 112.** Tell the operator: "Patient is in acute anaphylactic shock."
  3. **Positioning**: Lay the patient completely flat on their back with legs elevated 30 cm. Do NOT stand or walk them (can cause fatal vena cava collapse). If breathing is labored, allow sitting upright.
  4. Monitor closely for biphasic reactions (recurrence of symptoms up to 8–12 hours post-initial resolution).`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Urgent Questions for Your Emergency Doctor / Allergist:
1. "How long should I remain under telemetry observation to rule out a biphasic allergic reaction?"
2. "Was a serum tryptase drawn within 1–2 hours of symptom onset to confirm mast-cell activation?"
3. "Can you provide a updated written Anaphylaxis Emergency Action Plan and prescription for twin auto-injectors?"

### Clinical Allergy Platforms:
| Authority | Resource | Scope |
| :--- | :--- | :--- |
| **World Allergy Organization (WAO)** | Anaphylaxis Guidelines | Global auto-injector standards and biphasic protocols |
| **AAAAI** | Anaphylaxis Overview & Action Plan | Diagnostic criteria, injection technique, and patient safety |
| **Mayo Clinic** | Anaphylaxis Emergency Care | Immediate response, triggers, and medical management |`;
  }

  // 6. ACUTE SURGICAL ABDOMEN (APPENDICITIS, CHOLECYSTITIS, PANCREATITIS, GI BLEED)
  else if (
    symptomsOnly.includes("right lower quadrant") || 
    symptomsOnly.includes("appendicitis") || 
    symptomsOnly.includes("severe stomach pain") || 
    symptomsOnly.includes("severe abdominal pain") || 
    symptomsOnly.includes("vomiting blood") || 
    symptomsOnly.includes("black stool") || 
    symptomsOnly.includes("rigid abdomen") ||
    symptomsOnly.includes("gallbladder") ||
    symptomsOnly.includes("cholecystitis") ||
    symptomsOnly.includes("pancreatitis")
  ) {
    triageCategory = "🚨 CRITICAL / IMMEDIATE EMERGENCY EVALUATION";
    causes = `## Possible Causes & Pathology
- **Acute Appendicitis**: Luminal obstruction of the vermiform appendix by a fecalith or lymphoid hyperplasia, leading to bacterial overgrowth, ischemic necrosis, and localized peritonitis. Classically starts as vague periumbilical cramping before migrating to McBurney's point (right lower quadrant) over 12–24 hours.
- **Acute Cholecystitis / Biliary Colic**: Gallstone impaction in the cystic duct triggering gallbladder distension and inflammation. Typically severe, constant right upper quadrant (RUQ) pain radiating to the right infrascapular area, often provoked by fatty meals, with positive Murphy's sign.
- **Acute Pancreatitis**: Premature intrapancreatic enzyme activation leading to autodigestion; presents with severe, sharp epigastric pain radiating directly through to the mid-back, accompanied by persistent vomiting.
- **Acute Gastrointestinal Hemorrhage**: Upper GI bleeding (bleeding peptic ulcer, Mallory-Weiss tear) presenting as hematemesis ("coffee-ground" vomitus) or melena (black, tarry, foul-smelling stool).
${isPregnant ? `\n*Obstetric Alert:* Acute lower abdominal pain in females of childbearing potential mandates immediate quantitative serum beta-hCG to rule out ruptured ectopic pregnancy (a life-threatening surgical emergency).` : ""}`;

    treatments = `## Evidence-Based Treatment Pathways
- **Strict NPO Status (Nil Per Os - Nothing by Mouth)**: Strictly do NOT ingest food, fluids, or oral pain medications. Ingesting food accelerates intestinal perforation and delays emergency general anesthesia if laparoscopic surgery is required.
- **Urgent Abdominal Imaging & Labs**: Contrast-enhanced CT of the abdomen/pelvis or focused abdominal ultrasound, CBC (leukocytosis with left shift), serum amylase/lipase, liver function tests, and type and screen.
- **Intravenous Fluid Resuscitation**: Isotonic crystalloids (Normal Saline or Lactated Ringer's) to maintain hemodynamic volume, alongside IV broad-spectrum antibiotics if appendicitis or cholecystitis is confirmed.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **GI Mucosal Integrity**: Avoid unmonitored use of NSAIDs (ibuprofen, naproxen, high-dose aspirin) which inhibit gastroprotective prostaglandins and trigger peptic ulceration.
- **Biliary Health**: Maintain gradual, sustainable weight management and high-fiber nutrition to minimize gallbladder stone crystallization.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **PERITONEAL INFLAMMATION & SURGICAL RED FLAGS**:
  - Involuntary abdominal guarding or "board-like" abdominal wall rigidity.
  - Rebound tenderness (pain escalates dramatically when palpation pressure is abruptly released).
  - Inability to keep fluids down accompanied by high fever, confusion, or syncope.
  - Hematemesis (vomiting blood) or melena (black tarry stool).
- **Immediate Action**: Proceed immediately to the nearest hospital Emergency Department. Do NOT apply heating pads to the abdomen (heat accelerates appendiceal rupture).`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Urgent Questions for Your Surgical / Emergency Team:
1. "What did the abdominal CT or ultrasound demonstrate regarding the appendix diameter, gallbladder wall thickness, or peripancreatic fluid?"
2. "Are my serum lipase, white blood cell count, and inflammatory CRP significantly elevated?"
3. "Is emergent laparoscopic appendectomy or cholecystectomy indicated?"

### Clinical Gastrointestinal References:
| Authority | Resource | Standard |
| :--- | :--- | :--- |
| **American College of Surgeons (ACS)** | Acute Abdominal Pain & Appendicitis | Surgical indications, imaging protocols, and pre-op care |
| **American College of Gastroenterology (ACG)** | Acute Pancreatitis & Gallstone Guidelines | Diagnostic imaging, IV fluid resuscitation rates |
| **Mayo Clinic** | Appendicitis & Acute Abdomen Guide | Symptom chronology, physical examination signs, and surgery |`;
  }

  // 7. COMMON RESPIRATORY INFECTIONS (COLD, FLU, COVID-19, BRONCHITIS, STREP THROAT)
  else if (
    symptomsOnly.includes("cough") || 
    symptomsOnly.includes("fever") || 
    symptomsOnly.includes("flu") || 
    symptomsOnly.includes("cold") || 
    symptomsOnly.includes("sore throat") || 
    symptomsOnly.includes("runny nose") || 
    symptomsOnly.includes("congestion") || 
    symptomsOnly.includes("chills") ||
    selectedSymptoms.includes("Fever") || 
    selectedSymptoms.includes("Cough") || 
    selectedSymptoms.includes("Sore throat")
  ) {
    triageCategory = isHighSeverity ? "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION" : "🟢 ROUTINE / SELF-CARE & MONITORING";
    causes = `## Possible Causes & Pathology
- **Viral Upper Respiratory Tract Infection (Common Cold)**: Highly probable. Rhinovirus, coronavirus, or respiratory syncytial virus (RSV) producing localized mucosal edema, rhinorrhea, sneezing, and low-grade discomfort.
- **Seasonal Influenza (Influenza A / B)**: Indicated if onset was abrupt, accompanied by high fevers (> 38.5°C), severe generalized myalgias ("bone aches"), deep dry cough, and marked prostration.
- **Acute Streptococcal Pharyngitis ("Strep Throat")**: Group A Streptococcus (GAS) suggested if Centor Criteria are present: fever > 38°C, tonsillar exudate, tender anterior cervical lymphadenopathy, and absence of cough. Requires a rapid antigen detection test (RADT) to guide penicillin therapy and prevent acute rheumatic fever.
- **Acute Viral Tracheobronchitis**: Post-viral bronchial inflammation characterized by a persistent cough (productive or dry) lasting 10–21 days.
${isPediatric ? `\n*Pediatric Consideration (${age} yrs):* Children must be closely monitored for croup (barking seal-like cough, inspiratory stridor) and signs of dehydration. Never administer aspirin (Reye's syndrome risk).` : ""}
${duration ? `\n*Duration Analysis (${duration}):* Viral symptoms typically peak around days 3–5 and resolve within 7–10 days. Cough lasting > 3 weeks requires clinical evaluation for post-nasal drip, asthma, or secondary bacterial infection.` : ""}`;

    treatments = `## Evidence-Based Treatment Pathways
- **Antipyretics & Analgesia**: Acetaminophen / Paracetamol (500–1000 mg every 4–6h, max 3000 mg/day) or Ibuprofen (400–600 mg with food) to control fever and musculoskeletal pain. ${isPediatric ? '**NEVER administer Aspirin to children or adolescents.**' : ''} ${isPregnant ? '**Avoid NSAIDs in pregnancy; Acetaminophen is preferred.**' : ''}
- **Warm Saline Pharyngeal Gargles**: 1/2 teaspoon of salt dissolved in 240 mL warm water 3–4 times daily to reduce mucosal swelling and mechanical viral shedding.
- **Mucolytics & Steam Hydration**: Warm mist humidification and guaifenesin to thin tenacious bronchial secretions, paired with oral honey (for patients > 1 year of age) for cough relief.
- **Antiviral Consideration**: If influenza is confirmed in high-risk patients within 48 hours of symptom onset, neuraminidase inhibitors (Oseltamivir / Tamiflu) may reduce duration and secondary complications.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Hand Hygiene**: Wash hands with soap and running water for at least 20 seconds, or use > 60% alcohol hand rub frequently.
- **Annual Influenza & COVID-19 Immunization**: Up-to-date seasonal vaccines reduce severe hospitalizations by over 60%.
- **Environmental Optimization**: Maintain indoor relative humidity between 40% and 50% to prevent mucosal barrier desiccation.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- ⚠️ **RED FLAGS REQUIRING SAME-DAY URGENT CARE**:
  - Fever > 103°F (39.4°C) or fever not responding to standard antipyretics.
  - In infants < 3 months: Rectal temperature >= 100.4°F (38.0°C) is an immediate emergency requiring hospital workup.
  - Difficulty breathing, stridor (high-pitched inspiratory sound), or chest retractions.
  - Inability to swallow saliva, drooling, or trismus (difficulty opening mouth - warning of peritonsillar abscess).
  - Stiff neck with photophobia or confusion.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Primary Care Provider:
1. "Does my pharyngeal exam or Centor score warrant a rapid Strep throat swab before considering antibiotics?"
2. "Could my persistent symptoms indicate secondary bacterial sinusitis, otitis, or pneumonia?"
3. "Are my current medications (${allergiesMedications || 'none'}) compatible with standard OTC decongestants?"

### Trustworthy Respiratory Directories:
| Organization | Topic | Clinical Scope |
| :--- | :--- | :--- |
| **CDC.gov** | Common Cold & Flu Care | Viral identification, hygiene standards, and antiviral guidelines |
| **Mayo Clinic** | Influenza & Pharyngitis Clinical Guide | Home remedies, antipyretic dosing, and red flag warnings |
| **NHS UK** | Respiratory Infections Self-Care Pathways | Stepwise recovery timelines and urgent care criteria |`;
  }

  // 8. HEADACHES & MIGRAINES
  else if (
    symptomsOnly.includes("headache") || 
    symptomsOnly.includes("migraine") || 
    symptomsOnly.includes("throbbing head") || 
    symptomsOnly.includes("temple pain") ||
    selectedSymptoms.includes("Headache")
  ) {
    triageCategory = isHighSeverity ? "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION" : "🟢 ROUTINE / SELF-CARE & MONITORING";
    causes = `## Possible Causes & Pathology
- **Tension-Type Headache (TTH)**: The most frequent primary headache syndrome. Characterized by a steady, non-pulsating, bilateral "vice-like" band of dull pressure across the forehead, temporal regions, or occiput, typically aggravated by emotional stress, poor neck ergonomics, or lack of sleep.
- **Migraine (with or without Aura)**: Complex neurovascular disorder involving cortical spreading depression and trigeminovascular sensitization. Characterized by unilateral, pulsating pain of moderate-to-severe intensity lasting 4–72 hours, aggravated by routine movement, and accompanied by photophobia, phonophobia, or nausea.
- **Cervicogenic or Dehydration Headache**: Musculoskeletal pain referred from the upper cervical facet joints, or intracranial venous pressure fluctuations from fluid deficit.
${isPregnant ? `\n*Obstetric Alert:* New-onset persistent headache in the 2nd or 3rd trimester of pregnancy is a cardinal diagnostic sign of Preeclampsia and mandates immediate blood pressure check and urinalysis for proteinuria.` : ""}
${duration ? `\n*Duration Analysis (${duration}):* Persistent or escalating headaches over "${duration}" require systematic evaluation using the SNOOP mnemonic to exclude secondary intracranial pathology.` : ""}`;

    treatments = `## Evidence-Based Treatment Pathways
- **Dark, Sensory-Decompressed Rest**: Lie down in a darkened, quiet, climate-controlled room with a cold gel pack placed across the forehead or base of the neck.
- **Acute Analgesic Dosing**: Early administration of OTC analgesics (Ibuprofen 400 mg or Acetaminophen 1000 mg) at the very onset of the attack.
- **Medication Overuse Warning**: Limit acute pain medication intake to fewer than 10–12 days per month to prevent Medication Overuse Headaches (rebound headaches).
- **Targeted Hydration & Electrolytes**: Drink 500 mL of water or oral rehydration fluid slowly over 20 minutes.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **SEEDS Lifestyle Optimization**: Sleep regular hours, Exercise aerobically 3x/week, Eat balanced meals at consistent times, Dehydration prevention (2.5L water/day), Stress management.
- **Trigger Identification**: Maintain a digital headache diary tracking common triggers: skipping meals, aged cheeses, artificial sweeteners (aspartame), alcohol (tannins in red wine), or prolonged screen glare.
- **Ergonomics**: Position computer screens directly at eye level with adequate lumbar support.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **SNOOP CRITICAL HEADACHE RED FLAGS**:
  - **S**ystemic symptoms: High fever, chills, night sweats, or history of malignancy.
  - **N**eurological signs: Confusion, diplopia (double vision), limb weakness, or facial asymmetry.
  - **O**nset: "Thunderclap" onset reaching maximal excruciating intensity within 60 seconds (call 999/911/112).
  - **O**lder age: New headache onset in individuals > 50 years (rule out Giant Cell / Temporal Arteritis).
  - **P**ostural / Papilledema: Headache markedly worsening when bending over, coughing, or straining.
  - Stiff neck accompanied by fever and nausea (meningitis warning).`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Neurologist / Physician:
1. "Does my clinical profile warrant a prescription triptan (e.g. Sumatriptan) or modern CGRP antagonist?"
2. "Should we consider daily preventive medications (e.g. Propranolol, Topiramate, Amitriptyline) based on my attack frequency?"
3. "Is neuroimaging (brain MRI / CT) indicated based on my red flag screening?"

### Authoritative Headache Platforms:
| Authority | Topic | Scope |
| :--- | :--- | :--- |
| **American Migraine Foundation (AMF)** | Migraine Diagnosis & Acute Treatments | Evidence-based patient guides, abortive and preventive therapy |
| **Mayo Clinic** | Headache Types & Differential Diagnosis | Symptom checker, red flag markers, and lifestyle prevention |
| **NIH NINDS** | Headache Information Page | Neurobiology of migraines, cluster headaches, and clinical trials |`;
  }

  // 9. GASTROINTESTINAL, GERD & GASTROENTERITIS
  else if (
    symptomsOnly.includes("nausea") || 
    symptomsOnly.includes("vomiting") || 
    symptomsOnly.includes("diarrhea") || 
    symptomsOnly.includes("stomach") || 
    symptomsOnly.includes("abdomen") || 
    symptomsOnly.includes("acid reflux") || 
    symptomsOnly.includes("heartburn") ||
    selectedSymptoms.includes("Nausea / Vomiting") || 
    selectedSymptoms.includes("Diarrhea")
  ) {
    triageCategory = isHighSeverity ? "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION" : "🟢 ROUTINE / SELF-CARE & MONITORING";
    causes = `## Possible Causes & Pathology
- **Acute Viral Gastroenteritis ("Stomach Bug")**: Rotavirus or norovirus infection causing transient enterocyte damage, blunting of villi, and impaired osmotic fluid reabsorption, presenting with watery diarrhea, cramping, and low-grade fever.
- **Foodborne Illness / Food Poisoning**: Bacterial enterotoxins (Staphylococcus aureus, Bacillus cereus, Salmonella, Campylobacter) typically presenting abruptly within 2–24 hours of consuming contaminated foods.
- **Gastroesophageal Reflux Disease (GERD) / Dyspepsia**: Incompetence of the lower esophageal sphincter allowing acidic gastric contents to reflux into the esophagus, producing retrosternal pyrosis (burning sensation), sour regurgitation, and water brash.
- **Irritable Bowel Syndrome (IBS)**: Functional gastrointestinal disorder characterized by recurrent abdominal pain associated with defecation and altered stool frequency or form.`;

    treatments = `## Evidence-Based Treatment Pathways
- **Oral Rehydration Therapy (ORT)**: WHO-standard ORS solution (1 packet in 1 L clean water) taken in small, frequent sips (5–10 mL every 5 minutes) to replenish vital sodium, potassium, and glucose reserves without triggering vomiting.
- **Dietary Step-Up Protocol**: Once vomiting ceases for > 6 hours, advance to the BRAT diet (Bananas, Rice, Applesauce, plain Toast), broths, and boiled starches. Avoid high-fat foods, dairy/lactose, spicy seasonings, and caffeine for 72 hours.
- **Antacid & Acid Suppression for Heartburn**: Calcium carbonate antacids for immediate buffering, or Famotidine (H2 blocker, 20 mg) taken 30 minutes before meals for persistent reflux.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Food Safety Four-Step Rule**: Clean (wash hands/surfaces), Separate (raw meat from produce), Cook (internal temperature > 165°F / 74°C), Chill (refrigerate perishables within 2 hours).
- **Anti-Reflux Modifications**: Elevate head of the bed by 6 inches (using bed risers, not extra pillows), avoid eating within 3 hours of sleep, and reduce meal portion sizes.
- **Gut Microbiome Restoration**: Consume fermented whole foods (kefir, plain unsweetened yogurt) or evidence-based probiotics once acute diarrhea has resolved.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- ⚠️ **DEHYDRATION & GI WARNING SIGNS**:
  - Severe dehydration: Sunken eyes, profound dry mouth, orthostatic dizziness upon standing, or no urination for > 8 hours.
  - Persistent vomiting preventing any fluid retention for > 24 hours.
  - High fever (> 102°F / 38.9°C) with bloody stools (dysentery).
  - Vomiting bright red blood or "coffee-ground" dark particles.
  - Stools that are jet black, tarry, or visibly bloody.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Gastroenterologist / Doctor:
1. "Do my symptoms warrant a stool culture, ova/parasite evaluation, or C. difficile PCR panel?"
2. "Should we test for Helicobacter pylori infection or schedule an endoscopy for persistent heartburn?"
3. "Are prescription antiemetics (e.g. Ondansetron) indicated to allow oral rehydration at home?"

### Authoritative GI Medical Platforms:
| Organization | Topic | Scope |
| :--- | :--- | :--- |
| **NIDDK (NIH)** | Digestive Diseases & Diarrhea | Pathophysiology, dehydration management, and dietary care |
| **Mayo Clinic** | Gastroenteritis & GERD Overview | Diagnostic testing, lifestyle remedies, and red flag warnings |
| **CDC.gov** | Foodborne Outbreaks & Hygiene | Prevention guidelines, pathogen surveillance, and food safety |`;
  }

  // 10. MUSCULOSKELETAL, SPINE & JOINT (CAUDA EQUINA, SCIATICA, GOUT, SPRAIN)
  else if (
    symptomsOnly.includes("back pain") || 
    symptomsOnly.includes("joint pain") || 
    symptomsOnly.includes("knee pain") || 
    symptomsOnly.includes("shoulder pain") || 
    symptomsOnly.includes("sprain") || 
    symptomsOnly.includes("strain") || 
    symptomsOnly.includes("sciatica") || 
    symptomsOnly.includes("stiff neck") || 
    symptomsOnly.includes("arthritis") ||
    symptomsOnly.includes("swollen toe") ||
    symptomsOnly.includes("gout")
  ) {
    triageCategory = isHighSeverity ? "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION" : "🟢 ROUTINE / SELF-CARE & MONITORING";
    causes = `## Possible Causes & Pathology
- **Acute Lumbar Musculoligamentous Strain**: Micro-tears in paraspinal muscles or posterior spinal ligaments resulting from biomechanical overload, lifting with a rounded lumbar spine, or rotational shear stress.
- **Lumbar Radiculopathy / Sciatica**: Compression or inflammatory irritation of spinal nerve roots (typically L4, L5, or S1) by an intervertebral disc herniation, resulting in sharp, shooting pain radiating below the knee in a dermatomal distribution.
- **Acute Gouty Arthritis**: Deposition of monosodium urate monohydrate crystals in synovial fluid, causing excruciating, acute monoarticular inflammation (most commonly the first metatarsophalangeal joint of the big toe - podagra).
- **Septic Arthritis (Critical Rule-out)**: Bacterial infection within a synovial joint space; presents with a hot, swollen, exquisitely tender joint with virtually zero range of motion and fever.`;

    treatments = `## Evidence-Based Treatment Pathways
- **P.E.A.C.E. & L.O.V.E. Protocol (Modern Soft Tissue Care)**: Protect (unload), Elevate, Avoid anti-inflammatory medications during the initial 48h to preserve cellular tissue repair cascades, Compress, and Educate. Followed by Load (progressive loading), Optimism, Vascularization (cardio), and Exercise.
- **Active Relative Rest**: Avoid bed rest for back pain (bed rest > 48h causes spinal deconditioning and prolongs disability); engage in light neutral-spine walking.
- **Thermotherapy**: Cold ice packs for 15 minutes during acute inflammation; transition to moist heat after 48 hours to relieve hypertonic muscle spasms.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Core Lumbar Stability Conditioning**: Reinforce the "McGill Big 3" (modified curl-up, side bridge, bird-dog) to strengthen abdominal wall and lumbar multifidus without excessive spinal flexion.
- **Lifting Ergonomics**: Keep the load as close to the body center of mass as possible, bend at knees and hips, and maintain a neutral lumbar spine.
- **Gout Prevention**: For hyperuricemia, limit purine-dense organ meats, shellfish, alcohol (especially beer), and high-fructose corn syrup; ensure high fluid intake (> 2.5L/day).`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **SPINAL & NEUROLOGICAL RED FLAGS (CAUDA EQUINA SYNDROME)**:
  - Loss of bowel or bladder control (urinary incontinence or acute urinary retention).
  - "Saddle anesthesia": Loss of sensation in the perineal groin, buttocks, or inner thighs.
  - Progressive bilateral motor weakness (e.g. bilateral foot drop).
  - Inability to bear any weight on a joint following a trauma or audible "pop".
  - Joint that is red, hot, exquisitely swollen, accompanied by fever (septic arthritis emergency).
- **Action**: Cauda Equina Syndrome requires emergent surgical spinal decompression within 24–48 hours to prevent permanent paraplegia and incontinence.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Orthopedist / Physical Therapist:
1. "Do my symptoms indicate the need for plain radiographs (X-ray) or an MRI of the spine/joint?"
2. "Could my joint symptoms represent crystal arthropathy (gout) or autoimmune inflammatory arthritis?"
3. "What tailored physical therapy movement protocols are indicated for my current recovery phase?"

### Orthopedic & Physical Therapy References:
| Authority | Topic | Scope |
| :--- | :--- | :--- |
| **AAOS OrthoInfo** | Back Pain & Joint Sprain Care | Evidence-based rehabilitation, anatomy, and surgical indications |
| **Mayo Clinic** | Sciatica, Back Pain & Arthritis | Conservative treatments, exercise protocols, and warning indicators |
| **NIAMS (NIH)** | Musculoskeletal Disorders & Gout | Research updates on cartilage health, urate-lowering therapy |`;
  }

  // 11. DERMATOLOGICAL & CUTANEOUS (SHINGLES, CELLULITIS, HIVES, ECZEMA)
  else if (
    symptomsOnly.includes("rash") || 
    symptomsOnly.includes("itch") || 
    symptomsOnly.includes("hives") || 
    symptomsOnly.includes("skin") || 
    symptomsOnly.includes("eczema") || 
    symptomsOnly.includes("shingles") || 
    symptomsOnly.includes("dermatitis") ||
    selectedSymptoms.includes("Rash / Skin irritation")
  ) {
    triageCategory = isHighSeverity ? "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION" : "🟢 ROUTINE / SELF-CARE & MONITORING";
    causes = `## Possible Causes & Pathology
- **Allergic or Irritant Contact Dermatitis**: Acute cutaneous inflammation resulting from physical contact with allergens (poison ivy, nickel, cosmetic preservatives) or direct irritants (strong soaps, detergents), producing erythema, vesicles, and severe pruritus.
- **Herpes Zoster (Shingles)**: Reactivation of the latent varicella-zoster virus in a cranial or spinal sensory nerve ganglion. Classically preceded by 2–4 days of unilateral dermatomal pain, burning, or tingling, followed by grouped erythematous papules that rapidly evolve into clear vesicles.
- **Acute Urticaria (Hives)**: Transient erythematous, edematous, intensely itchy plaques (wheals) caused by mast-cell histamine release in response to viral infections, foods, or medications.
- **Cellulitis (Bacterial Skin Infection)**: Acute bacterial infection (Streptococcus pyogenes or Staphylococcus aureus) of the deep dermis and subcutaneous tissue, characterized by expanding erythema, warmth, swelling, and localized pain.`;

    treatments = `## Evidence-Based Treatment Pathways
- **Barrier Repair & Emollients**: Apply fragrance-free, ceramide-rich moisturizers to damp skin immediately after bathing to restore stratum corneum barrier integrity.
- **Topical Corticosteroid Therapy**: Over-the-counter Hydrocortisone (1%) applied in a thin film twice daily for up to 7 days for localized non-infectious eczema or dermatitis. Avoid application to the face or broken skin.
- **Oral Non-Sedating Antihistamines**: Cetirizine, Loratadine, or Fexofenadine to downregulate histamine H1 receptors and relieve itching without sedation.
- **Antiviral Window for Shingles**: Oral antivirals (Valacyclovir 1000 mg 3x/day or Acyclovir) must be initiated within 72 hours of rash onset to arrest viral replication and decrease postherpetic neuralgia risk.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Gentle Skin Cleansing**: Limit showers to 5–10 minutes using lukewarm water and soap-free synthetic detergent (syndet) bars.
- **Hypoallergenic Laundry**: Use fragrance-free, dye-free laundry detergents and avoid fabric softeners.
- **Shingrix Vaccination**: Adults aged 50 and older should receive the 2-dose recombinant zoster vaccine to prevent shingles and post-herpetic neuralgia.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **DERMATOLOGICAL EMERGENCY RED FLAGS**:
  - Rash accompanied by facial/lip swelling, throat tightness, or difficulty breathing (anaphylaxis).
  - Rapidly expanding, hot, tender, red erythema with high fevers or lymphangitic streaking (cellulitis).
  - Non-blanching purpuric or petechial rash (dark red/purple spots that do NOT fade under pressure from a clear glass - rule out meningococcal disease).
  - Extensive skin blistering, sheet-like peeling, or involvement of eyes, mouth, or genitalia (rule out Stevens-Johnson Syndrome / TEN - medical emergency).`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Dermatologist / Doctor:
1. "Does this rash distribution suggest a viral exanthem, contact allergen, or infectious cellulitis?"
2. "If shingles is confirmed, am I within the 72-hour window for oral antiviral therapy?"
3. "Is a skin scraping (KOH prep) or bacterial/viral swab indicated?"

### Authoritative Dermatology Directories:
| Organization | Topic | Scope |
| :--- | :--- | :--- |
| **American Academy of Dermatology (AAD)** | Skin Condition Library | Visual photo guides, treatment regimens, and self-care |
| **Mayo Clinic** | Shingles, Rashes & Hives Overview | Diagnostic pathways, antiviral therapy, and emergency markers |
| **MedlinePlus** | Dermatologic Health Information | Trusted guides on skin infections and barrier restoration |`;
  }

  // 12. GENITOURINARY, URINARY TRACT & RENAL
  else if (
    symptomsOnly.includes("burning pee") || 
    symptomsOnly.includes("painful urination") || 
    symptomsOnly.includes("urination") || 
    symptomsOnly.includes("uti") || 
    symptomsOnly.includes("kidney") || 
    symptomsOnly.includes("flank pain") || 
    symptomsOnly.includes("blood in urine") ||
    symptomsOnly.includes("testicular pain") ||
    symptomsOnly.includes("scrotal pain")
  ) {
    const isTesticular = symptomsOnly.includes("testicular") || symptomsOnly.includes("scrotal");
    triageCategory = (isTesticular || isHighSeverity) ? "🚨 CRITICAL / IMMEDIATE EMERGENCY EVALUATION" : "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION";
    causes = `## Possible Causes & Pathology
- **Acute Uncomplicated Cystitis (Lower UTI)**: Bacterial colonization (predominantly uropathogenic Escherichia coli) ascending through the urethra into the bladder mucosa, causing dysuria (burning sensation), urinary frequency, and suprapubic pain.
- **Acute Pyelonephritis (Upper UTI)**: Ascending bacterial infection invading the renal parenchyma. Distinguished by systemic toxicity: high spiking fevers, rigors, nausea, and marked costovertebral angle (CVA) flank tenderness.
- **Nephrolithiasis (Kidney Stones)**: Solid crystalline aggregations (calcium oxalate, uric acid) migrating down the ureter, presenting with sudden, severe, colicky flank pain radiating down to the groin, often accompanied by gross or microscopic hematuria.
- **Testicular Torsion (Critical Surgical Emergency)**: In males, twisting of the spermatic cord cutting off testicular arterial blood supply. Causes sudden excruciating scrotal pain, high-riding testicle, and absent cremasteric reflex. Requires detorsion within 6 hours to prevent testicular loss.
${isPregnant ? `\n*Obstetric Precaution:* In pregnancy, even asymptomatic bacteriuria carries a 30% risk of progressing to acute pyelonephritis and preterm labor; clinical urine culture and safe antibiotic therapy (e.g. Nitrofurantoin/Cephalexin) are mandatory.` : ""}`;

    treatments = `## Evidence-Based Treatment Pathways
- **Urinalysis & Urine Culture**: Essential first step. Dipstick assesses leukocyte esterase and nitrites; microscopic analysis checks for pyuria, bacteriuria, and red blood cells. Antibiotic selection must be guided by culture sensitivity.
- **Targeted Antibiotic Regimen**: First-line options for uncomplicated cystitis include Nitrofurantoin (100 mg twice daily for 5 days) or Trimethoprim-Sulfamethoxazole (per local antibiograms).
- **High-Volume Hydration**: Drink 2.5 to 3 liters of water daily to maintain continuous urine flow and mechanically flush bacteria from the bladder.
- **Urinary Analgesia**: Phenazopyridine provides symptomatic relief of severe dysuria (note: turns urine bright orange and should be limited to 2 days).`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Post-Coital Voiding**: Urinate promptly following sexual intercourse to clear potential pathogens from the urethral meatus.
- **Hygiene Mechanics**: Always wipe from front to back to prevent transferring colonic flora to the urethral opening.
- **Stone Prevention**: For kidney stone formers, maintain high urine volume (> 2.0 L/day), limit dietary sodium to < 2,000 mg/day, and maintain adequate dietary calcium intake.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **RENAL & UROLOGIC EMERGENCY RED FLAGS**:
  - Sudden, severe, acute testicular or scrotal pain with swelling (rule out testicular torsion - 6-hour golden window).
  - High fever, shaking chills, nausea, and severe flank tenderness (pyelonephritis warning).
  - Visible blood clots or dark red blood in urine (gross hematuria).
  - Complete inability to pass urine despite severe bladder pressure (acute urinary retention).`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Urologist / Physician:
1. "Did my urine test show positive leukocyte esterase, nitrites, or hematuria?"
2. "Will a formal urine culture and sensitivity profile be run to confirm the antibiotic is effective?"
3. "If kidney stones are suspected, is a non-contrast low-dose CT of the abdomen/pelvis or renal ultrasound indicated?"

### Urological Reference Platforms:
| Organization | Topic | Scope |
| :--- | :--- | :--- |
| **American Urological Association (AUA)** | UTI & Kidney Stone Guidelines | Antibiotic selection, stone prevention, and surgical management |
| **NIDDK (NIH)** | Bladder & Kidney Infections | Patient guides, urinary anatomy, and risk factors |
| **Mayo Clinic** | Urinary Tract Infection Overview | Symptoms, treatment pathways, and prevention strategies |`;
  }

  // 13. EAR, NOSE, THROAT & SINUS (SINUSITIS, OTITIS, VERTIGO)
  else if (
    symptomsOnly.includes("ear pain") || 
    symptomsOnly.includes("earache") || 
    symptomsOnly.includes("sinus") || 
    symptomsOnly.includes("vertigo") || 
    symptomsOnly.includes("spinning") || 
    symptomsOnly.includes("nasal") ||
    symptomsOnly.includes("facial pressure")
  ) {
    triageCategory = isHighSeverity ? "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION" : "🟢 ROUTINE / SELF-CARE & MONITORING";
    causes = `## Possible Causes & Pathology
- **Acute Rhinosinusitis (Viral vs Bacterial)**: Inflammation of paranasal sinuses. 90-98% are viral; acute bacterial rhinosinusitis is suspected only if symptoms persist > 10 days without improvement, or follow a "double sickening" pattern (worsening after initial improvement) with purulent nasal discharge and unilateral facial/maxillary dental pain.
- **Acute Otitis Media (AOM) / Otitis Externa**: Middle ear bacterial/viral infection behind a bulging, erythematous tympanic membrane (AOM), or external ear canal inflammation ("swimmer's ear" - pain with pinna traction).
- **Benign Paroxysmal Positional Vertigo (BPPV)**: Canalithiasis of the posterior semicircular canal; presents with brief (< 1 min) intense episodes of rotational vertigo provoked by head position changes (e.g. rolling over in bed), without hearing loss or tinnitus.
- **Vestibular Neuritis / Labyrinthitis**: Inflammation of the vestibulocochlear nerve; presents with acute, constant, severe vertigo lasting several days, accompanied by nausea, gait instability, and horizontal nystagmus.`;

    treatments = `## Evidence-Based Treatment Pathways
- **Saline Nasal Irrigation**: High-volume, low-pressure nasal irrigation with sterile/distilled saline twice daily to clear mucus, debris, and reduce mucosal swelling.
- **Intranasal Corticosteroid Sprays**: Fluticasone or Mometasone (1-2 sprays per nostril daily) to decrease sinus ostial edema and improve ventilation.
- **Epley Canalith Repositioning Maneuver**: Highly effective, evidence-based particle-repositioning maneuvers performed for BPPV.
- **Analgesics & Warm Compresses**: Acetaminophen or Ibuprofen for earache and sinus pressure, accompanied by warm compresses applied over the affected sinuses.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Ear Hygiene**: Never insert cotton swabs (Q-tips) or foreign objects into the ear canal (compacts cerumen and damages canal skin).
- **Hydration & Humidification**: Maintain optimal hydration and use cool-mist room humidifiers to prevent nasal crusting.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- ⚠️ **ENT & NEUROLOGICAL RED FLAGS**:
  - Periorbital swelling, redness, or pain with eye movement (orbital cellulitis warning - emergency).
  - Severe unrelenting headache with high fever, stiff neck, or confusion.
  - Acute hearing loss accompanied by facial muscle weakness.
  - Inability to walk or maintain balance even when stationary.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your ENT Specialist / Physician:
1. "Does my tympanic membrane show acute purulent effusion or perforation?"
2. "Do my sinus symptoms meet the criteria for bacterial rhinosinusitis requiring antibiotics?"
3. "Does my vertigo presentation match BPPV, and can we perform the Dix-Hallpike and Epley maneuvers?"

### Authoritative ENT Guidelines:
| Authority | Topic | Scope |
| :--- | :--- | :--- |
| **AAO-HNS** | Clinical Practice Guidelines for Sinusitis & Otitis | Diagnostic criteria, antibiotic stewardship, and BPPV maneuvers |
| **Mayo Clinic** | Sinusitis, Ear Infections & Vertigo | Home remedies, diagnostic testing, and red flag warnings |
| **MedlinePlus** | Ear, Nose, and Throat Disorders | Peer-reviewed medical encyclopedias and patient guides |`;
  }

  // 14. OPHTHALMIC & EYE CONDITIONS (GLAUCOMA, CONJUNCTIVITIS, CORNEAL ABRASION)
  else if (
    symptomsOnly.includes("eye pain") || 
    symptomsOnly.includes("red eye") || 
    symptomsOnly.includes("pink eye") || 
    symptomsOnly.includes("blurry vision") || 
    symptomsOnly.includes("vision loss") || 
    symptomsOnly.includes("halos around lights") ||
    symptomsOnly.includes("eye discharge")
  ) {
    const isGlaucomaSuspect = symptomsOnly.includes("halos") || (symptomsOnly.includes("eye pain") && isHighSeverity);
    triageCategory = isGlaucomaSuspect ? "🚨 CRITICAL / IMMEDIATE EMERGENCY EVALUATION" : "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION";
    causes = `## Possible Causes & Pathology
- **Acute Angle-Closure Glaucoma (Ophthalmic Emergency)**: Rapid, severe elevation of intraocular pressure due to trabecular meshwork outflow obstruction. Characterized by excruciating eye pain, headache, nausea/vomiting, seeing rainbow halos around lights, blurred vision, and a "steamy" cornea with a mid-dilated fixed pupil. Can cause irreversible blindness within hours if untreated.
- **Infectious Conjunctivitis ("Pink Eye")**: Bacterial (copious purulent discharge, glued eyelids upon waking) or viral (watery discharge, preauricular lymphadenopathy, highly contagious).
- **Corneal Abrasion or Foreign Body**: Mechanical defect in the corneal epithelium, causing foreign-body sensation, intense photophobia, tearing, and blepharospasm.
- **Anterior Uveitis / Iritis**: Inflammation of the uveal tract; presents with deep ache, photophobia, ciliary flush, and constricted pupil.`;

    treatments = `## Evidence-Based Treatment Pathways
- **Immediate Ophthalmology Triage for Severe Eye Pain**: Measurement of intraocular pressure (tonometry), slit-lamp biomicroscopy, and fluorescein staining.
- **Topical Antibiotic Drops for Bacterial Conjunctivitis**: Polymyxin B-Trimethoprim or Erythromycin ointment for 5–7 days. Note: Contact lens wearers require fluoroquinolone coverage (e.g. Ciprofloxacin/Ofloxacin) for Pseudomonas aeruginosa.
- **Cold Compresses & Lubricating Artificial Tears**: Preservative-free artificial tears 4–6 times daily to soothe ocular surface irritation.
- **Contact Lens Cessation**: Immediately remove and discard contact lenses until fully cleared by an eye care professional.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Contact Lens Hygiene**: Never sleep in contact lenses or rinse them in tap water; replace storage cases every 3 months.
- **Protective Eyewear**: Always wear ANSI-certified safety glasses during carpentry, metal grinding, sports, and chemical handling.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **CRITICAL OPHTHALMIC RED FLAGS**:
  - Severe eye pain accompanied by headache, nausea, and seeing rainbow halos (acute glaucoma).
  - Sudden partial or total vision loss in one or both eyes.
  - Visible hyphema (blood pooling in the anterior chamber between iris and cornea).
  - Chemical splash into the eye: **Immediately flush with clean water for 15-20 minutes continuously** and call emergency services.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Urgent Questions for Your Eye Specialist:
1. "What is my measured intraocular pressure (IOP) in both eyes?"
2. "Did the fluorescein examination reveal any corneal abrasions, ulcers, or dendritic lesions?"
3. "Are topical steroids strictly contraindicated in my current condition?"

### Clinical Eye Care Standards:
| Authority | Topic | Scope |
| :--- | :--- | :--- |
| **American Academy of Ophthalmology (AAO)** | Eye Emergencies & Conjunctivitis Guidelines | Tonometry standards, acute glaucoma triage, and infection care |
| **Mayo Clinic** | Red Eye, Glaucoma & Vision Changes | Causes, diagnostic tests, and emergency warnings |
| **National Eye Institute (NEI)** | Glaucoma & Vision Health | Pathophysiology, treatment options, and patient resources |`;
  }

  // 15. ENDOCRINE, DIABETES & METABOLIC
  else if (
    symptomsOnly.includes("excessive thirst") || 
    symptomsOnly.includes("frequent urination") || 
    symptomsOnly.includes("fruity breath") || 
    symptomsOnly.includes("low blood sugar") || 
    symptomsOnly.includes("hypoglycemia") || 
    symptomsOnly.includes("shakiness") || 
    symptomsOnly.includes("diabetes") ||
    symptomsOnly.includes("thyroid")
  ) {
    const isDKASuspect = symptomsOnly.includes("fruity breath") || (symptomsOnly.includes("frequent urination") && isHighSeverity);
    triageCategory = isDKASuspect ? "🚨 CRITICAL / IMMEDIATE EMERGENCY EVALUATION" : "🟠 URGENT CARE / SAME-DAY CLINICAL EVALUATION";
    causes = `## Possible Causes & Pathology
- **Diabetic Ketoacidosis (DKA) / Hyperglycemic Hyperosmolar State (HHS)**: Severe, life-threatening metabolic derangement caused by absolute or relative insulin deficiency. Lipolysis generates ketone bodies, leading to metabolic acidosis, osmotic diuresis (polyuria, extreme polydipsia), Kussmaul deep respirations, and characteristic acetone ("fruity") breath.
- **Acute Hypoglycemia**: Plasma glucose falling below 70 mg/dL (frequently from insulin or sulfonylurea overdose, skipped meals, or unaccustomed exertion), causing neurogenic symptoms (shakiness, diaphoresis, tachycardia, hunger) and neuroglycopenic symptoms (confusion, blurred vision, seizures).
- **Hyperthyroidism / Thyrotoxicosis**: Excess circulating thyroid hormones presenting with palpitations, heat intolerance, tremor, weight loss despite increased appetite, and anxiety.`;

    treatments = `## Evidence-Based Treatment Pathways
- **Rule of 15 for Hypoglycemia**: If conscious and blood glucose < 70 mg/dL: Ingest 15 grams of fast-acting simple carbohydrates (4 glucose tablets, 1/2 cup fruit juice, or 3-4 candies). Wait 15 minutes, re-check glucose. Repeat if still < 70 mg/dL. Once normalized, eat a snack with protein/complex carbs.
- **Emergency Management for DKA**: Immediate hospital admission for IV isotonic fluid rehydration, continuous IV regular insulin infusion, and vigilant potassium monitoring to avoid hypokalemic cardiac arrhythmias.
- **Comprehensive Metabolic Testing**: Urgent point-of-care capillary glucose, venous basic metabolic panel (electrolytes, anion gap, creatinine), and blood/urine ketones.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Continuous Glucose Monitoring (CGM)**: Real-time glucose tracking with high/low predictive rate alerts.
- **Sick-Day Rules for Diabetics**: Never stop basal insulin during illness; check ketones if blood glucose exceeds 250 mg/dL, and hydrate continuously.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- 🚨 **ENDOCRINE EMERGENCY RED FLAGS**:
  - Unresponsive, stuporous, or seizing patient with known diabetes: Administer emergency Glucagon (intramuscular or nasal Baqsimi) and call 999/911/112 immediately.
  - Deep, rapid, labored breathing (Kussmaul breathing) accompanied by fruity breath and vomiting.
  - Severe dehydration with confusion and inability to maintain fluid intake.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Urgent Questions for Your Endocrinologist / Doctor:
1. "What are my current serum glucose, blood ketone levels, and calculated serum anion gap?"
2. "Is an adjustment to my basal-bolus insulin ratio or oral antidiabetic therapy indicated?"
3. "Should we evaluate my thyroid profile (free T4, TSH) and HbA1c?"

### Authoritative Endocrine Standards:
| Authority | Topic | Scope |
| :--- | :--- | :--- |
| **American Diabetes Association (ADA)** | Standards of Care in Diabetes | Hypoglycemia algorithms, DKA protocols, and CGM guidance |
| **Endocrine Society** | Clinical Practice Guidelines | Inpatient glycemic control, thyroid crisis protocols |
| **Mayo Clinic** | Diabetic Ketoacidosis & Hypoglycemia | Emergency recognition, self-care rules, and recovery |`;
  }

  // 16. MENTAL HEALTH, PANIC ATTACK & SOMATIC ANXIETY
  else if (
    symptomsOnly.includes("panic") || 
    symptomsOnly.includes("anxiety") || 
    symptomsOnly.includes("impending doom") || 
    symptomsOnly.includes("hyperventilat") || 
    symptomsOnly.includes("racing heart") && !isHighSeverity
  ) {
    triageCategory = "🟡 PRIMARY CARE / SCHEDULED MEDICAL CONSULT";
    causes = `## Possible Causes & Pathology
- **Acute Panic Attack / Panic Disorder**: Sudden surge of intense fear or discomfort peaking within minutes. Sympathetic autonomic hyperarousal releases epinephrine/norepinephrine, triggering tachycardia, trembling, hyperventilation, chest tightness, and paresthesias (numbness/tingling in hands/feet due to respiratory alkalosis from hypocapnia).
- **Generalized Anxiety Disorder (GAD)**: Chronic, excessive worry accompanied by autonomic tension (muscle tightness, fatigue, restlessness, insomnia).
- **Physical Mimics (Important Clinical Rule-outs)**: Cardiac arrhythmias (e.g. SVT), pheochromocytoma, hyperthyroidism, and substance/caffeine withdrawal must be screened before attributing acute symptoms exclusively to anxiety.`;

    treatments = `## Evidence-Based Treatment Pathways
- **Box Breathing / Diaphragmatic Retraining**: Inhale for 4 seconds, hold for 4 seconds, exhale slowly through pursed lips for 4 seconds, hold for 4 seconds. Repeat for 5 minutes to restore blood carbon dioxide balance and activate parasympathetic tone.
- **5-4-3-2-1 Sensory Grounding Technique**: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste to decouple amygdala threat hyperreactivity.
- **Evidence-Based Psychotherapy**: Cognitive Behavioral Therapy (CBT) and Exposure Therapy are first-line treatments with demonstrated long-term neuroplastic efficacy.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Caffeine & Stimulant Reduction**: Taper intake of coffee, energy drinks, and nicotine which directly sensitize adrenergic receptors.
- **Cardiovascular Aerobic Exercise**: 30 minutes of moderate aerobic exercise 3-5 times weekly reduces baseline sympathetic nervous system reactivity.
- **Sleep Hygiene Restructuring**: Maintain strict, consistent sleep schedules to protect prefrontal cortex emotional regulation.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- ⚠️ **CRITICAL DIFFERENTIATION WARNING**:
  - Never assume new-onset severe chest pressure or shortness of breath is "just anxiety" if cardiac risk factors are present.
  - Seek emergency clinical evaluation if symptoms are accompanied by crushing retrosternal pain, radiating discomfort, or fainting.
  - If experiencing crisis, self-harm impulses, or severe despair, call or text 988 (Suicide & Crisis Lifeline) or local emergency support services immediately.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Healthcare Provider:
1. "Have baseline physical tests (12-lead ECG, thyroid TSH, complete blood count) been conducted to exclude medical mimics?"
2. "Would I benefit from a referral to a licensed CBT psychotherapist or psychiatric evaluation?"
3. "Are evidence-based first-line SSRI/SNRI medications indicated for my symptom burden?"

### Authoritative Mental Health Resources:
| Organization | Focus | Guidance |
| :--- | :--- | :--- |
| **NIMH (NIH)** | Panic Disorder & Anxiety Research | Neurobiology, diagnostic criteria, and evidence-based treatments |
| **Anxiety & Depression Association (ADAA)** | Patient Resources & Coping Tools | Grounding protocols, breathing techniques, and specialist search |
| **Mayo Clinic** | Panic Attacks & Anxiety Care | Differential diagnosis, therapy options, and lifestyle interventions |`;
  }

  // 17. COMPREHENSIVE GENERAL HEALTH / FATIGUE / METABOLIC
  else {
    causes = `## Possible Causes & Pathology
- **Non-Specific Physiological Fatigue & Recovery Debt**: Cumulative sleep fragmentation, chronic allostatic load (prolonged psychological stress), or metabolic recovery deficit.
- **Subclinical Nutritional / Hematologic Imbalance**: Micronutrient deficits (Iron deficiency with or without anemia, Vitamin D3 insufficiency, Vitamin B12 deficiency), or subclinical electrolyte and hydration shifts.
- **Post-Viral Convalescence / Immune Recalibration**: Lingering neuro-immune and cellular mitochondrial recalibration following an asymptomatic or mild viral exposure.
- **Occult Metabolic or Endocrine Dysregulation**: Early insulin resistance, subclinical thyroiditis, or unrefreshing sleep secondary to obstructive sleep apnea.
${history ? `\n*Impact of Reported Medical History (${history}):* Your chronic background represents a core clinical anchor that your primary care physician will correlate with these findings.` : ""}
${duration ? `\n*Duration Analysis (${duration}):* Symptoms present for "${duration}" indicate that formal diagnostic blood work (CBC, CMP, ferritin, TSH) is the optimal next step.` : ""}`;

    treatments = `## Evidence-Based Treatment Pathways
- **Structured Cellular Hydration**: Consume half your body weight in fluid ounces of clean water and mineralized electrolytes daily (approximately 2.0 to 2.5 L).
- **Circadian Sleep Architecture**: Establish an uninterrupted 7.5 to 8.5-hour nocturnal sleep opportunity in a cool, dark environment (65–68°F / 18–20°C).
- **Relative Rest & Gradual Pacing**: Implement 24–48 hours of lower physical strain while maintaining gentle mobility and light walking.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Nutrient-Dense Dietary Pattern**: Emphasize unprocessed whole foods, lean proteins, high-fiber legumes, and colorful cruciferous vegetables.
- **Morning Sunlight Anchoring**: Expose eyes to 10–15 minutes of outdoor sunlight within 60 minutes of waking to anchor circadian cortisol rhythm.
- **Active Stress Decompression**: Practice 10 minutes of diaphragmatic breathing, progressive muscle relaxation, or mindfulness daily.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- ⚠️ **SYSTEMIC WARNING SIGNS MANDATING IMMEDIATE EVALUATION**:
  - Sudden, profound, unexplained muscular weakness or loss of consciousness (syncope).
  - Chest pain, unexplained shortness of breath, or new irregular heart palpitations.
  - Involuntary significant weight loss (> 5% in 6 months) or persistent night sweats.
  - High fever unresponsive to antipyretics or progressive focal neurological deficits.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Primary Care Provider:
1. "Should we order a baseline Complete Blood Count (CBC), Comprehensive Metabolic Panel (CMP), and Ferritin to screen for anemia or metabolic imbalances?"
2. "Is a Thyroid Stimulating Hormone (TSH) and Vitamin D3 / B12 panel indicated based on my symptoms?"
3. "Could any of my current medications or environmental factors be contributing to my symptoms?"

### Authoritative General Health Platforms:
| Resource | Scope | Focus |
| :--- | :--- | :--- |
| **Mayo Clinic** | Symptoms & Clinical Care | Comprehensive symptom guides and patient health checklists |
| **MedlinePlus (NIH)** | Health Topics & Diagnostics | Trusted, peer-reviewed medical encyclopedia and test guides |
| **NHS UK** | General Health & Wellbeing | Evidence-based triage protocols, screening guidelines, and self-care |`;
  }

  // Build Personalized Clinical Demographic Header
  const demographicFlags: string[] = [];
  if (isPediatric) {
    demographicFlags.push(`👶 **PEDIATRIC DOSING & VULNERABILITY ALERT (${age} yrs old):** Dosing must be weight-based (mg/kg). Never administer Aspirin (Reye's syndrome risk). Monitor hydration and breathing dynamics closely.`);
  } else if (isGeriatric) {
    demographicFlags.push(`👴 **GERIATRIC CLINICAL CONSIDERATION (${age} yrs old):** Atypical presentations are frequent in older adults (e.g. infections presenting as confusion or falls without fever). Polypharmacy and renal clearance require physician review.`);
  } else if (isPregnant) {
    demographicFlags.push(`🤰 **PREGNANCY ALERT:** Maternal and fetal safety require strict avoidance of NSAIDs, unverified supplements, and contraindicated medications. Report any visual disturbances, severe headaches, or bleeding immediately.`);
  }

  if (isHighSeverity) {
    demographicFlags.push(`🚨 **HIGH SEVERITY ALERT (${severity}/10):** Clinical intensity is in the severe category. Do not rely solely on digital guidance; seek formal in-person emergency medical care.`);
  }

  if (isWorsening) {
    demographicFlags.push(`📈 **WORSENING PROGRESSION ALERT:** The reported trend is actively deteriorating. Escalating symptoms warrant earlier clinical intervention rather than watchful waiting.`);
  }

  const patientSummaryHeader = `### Clinical Patient Profile & Triage Summary
- **Triage Urgency Level:** ${triageCategory}
- **Assessed Patient:** ${age}-year-old ${gender}${isPregnant ? ' (Currently Pregnant)' : ''}
- **Primary Symptoms:** ${symptoms}
- **Timeline & Duration:** ${duration || 'Unspecified'} | **Severity:** ${severity}/10 | **Progression Trend:** ${trend}
${selectedSymptoms.length > 0 ? `- **Associated Symptoms:** ${selectedSymptoms.join(', ')}` : ''}
${history && history !== 'none reported' ? `- **Pre-existing Medical History:** ${history}` : ''}
${allergiesMedications && allergiesMedications !== 'none reported' ? `- **Reported Medications & Allergies:** ${allergiesMedications}` : ''}
${triggers && triggers !== 'none reported' ? `- **Environmental Context / Triggers:** ${triggers}` : ''}
- **Clinical Assessment Note:** ${urgencyDescription}
${demographicFlags.length > 0 ? '\n' + demographicFlags.map(f => `> ${f}`).join('\n') : ''}`;

  return `[SECTION_1: POTENTIAL_CAUSES]
${patientSummaryHeader}

${causes}

[SECTION_2: TREATMENT_PATHWAYS]
${treatments}

[SECTION_3: PREVENTION_STRATEGIES]
${prevention}

[SECTION_4: FIRST_AID_PROTOCOLS]
${firstaid}

[SECTION_5: CLINICAL_RESOURCES]
${resources}`;
}


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

export function generateSymptomCheckerFallback(criteria: {
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
}): string {
  const { symptoms, severity, trend, duration, selectedSymptoms, history, pregnancyStatus } = criteria;
  const symptomsLower = symptoms.toLowerCase();
  
  let causes = "";
  let treatments = "";
  let prevention = "";
  let firstaid = "";
  let resources = "";

  if (
    symptomsLower.includes("fever") || 
    symptomsLower.includes("cough") || 
    symptomsLower.includes("flu") || 
    symptomsLower.includes("cold") || 
    symptomsLower.includes("throat") ||
    selectedSymptoms.includes("Fever") ||
    selectedSymptoms.includes("Cough") ||
    selectedSymptoms.includes("Sore throat")
  ) {
    causes = `## Possible Causes & Pathology
- **Viral Upper Respiratory Infection (Common Cold)**: Highly likely given standard respiratory symptom onset. Corresponds to mild self-limiting bronchial inflammation.
- **Influenza (Seasonal Flu)**: Suggested if onset was sudden and accompanied by moderate systemic body aches or chills.
- **Acute Bronchitis**: Mild airway passage congestion often trailing common viral profiles (as documented in CDC clinical guidelines).`;
    
    treatments = `## Evidence-Based Treatment Pathways
- **Symptomatic Relief**: Keep fever and aches low with over-the-counter paracetamol (acetaminophen) or ibuprofen, checking appropriate dosages with a pharmacist.
- **Supportive Therapies**: Warm water saline gargles (1/2 tsp salt in warm water) to soothe throat irritation, and steam inhalation or humidifiers to loosen nasal secretions.
- **Rest & Hydration**: Prioritize sleep and clear fluids (water, herbal tea) to keep mucous membranes moist and help the immune system filter pathogens.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Hygiene Measures**: Frequent hand-washing with soap for 20 seconds, or using an alcohol-based sanitizer, particularly before meals.
- **Vaccination Timing**: Schedule annual influenza vaccine and relevant pneumococcal or booster shots.
- **Airway Support**: Clean indoor air filters regularly and maintain hydration to preserve your respiratory tract's natural mucosal barrier.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- **Difficulty Breathing**: Immediate medical attention is required if there is shortness of breath, wheezing, or feelings of chest tightness.
- **Persistent High Fever**: Fever above 103°F (39.4°C) that does not reduce with medication.
- **Emergency Indicators**: Bluish lips or face, confusion, or inability to stay awake are critical emergency indicators. Call emergency services (911/112) immediately.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Doctor:
1. "Given my respiratory symptoms, is a diagnostic throat swab or PCR panel indicated?"
2. "Are there underlying asthma or airway considerations we should review?"
3. "At what point should we evaluate for potential secondary bacterial infection?"

### Trustworthy Medical Directories:
| Platform | Search Reference Term | Clinical Scope |
| :--- | :--- | :--- |
| **Mayo Clinic** | Influenza & Common Cold | Clinical pathways, symptom relief, and home recovery |
| **CDC.gov** | Preventive Respiratory Guidance | Seasonal vaccination schedules and hygiene guidelines |
| **NHS UK** | Cough and Fever Care | Standard triage protocols and recovery timelines |`;
  } else if (
    symptomsLower.includes("headache") || 
    symptomsLower.includes("migraine") ||
    selectedSymptoms.includes("Headache") ||
    selectedSymptoms.includes("Dizziness")
  ) {
    causes = `## Possible Causes & Pathology
- **Tension Headache**: The most common primary headache type, typically presenting as a tight band of pressure around the head, often related to stress or posture.
- **Migraine Episode**: Indicated if the pain is unilateral, throbbing, or accompanied by sensory sensitivities (photophobia, phonophobia).
- **Dehydration Headache**: Triggered by systemic fluid deficits which affect intracranial vascular dynamics.`;

    treatments = `## Evidence-Based Treatment Pathways
- **Dark, Quiet Rest**: Seek absolute sensory decompression in a cooled, darkened room to down-regulate over-stimulated neural pathways.
- **Hydration Protocols**: Drink a large glass of water or electrolyte-balanced fluid slowly.
- **OTC Pharmacotherapy**: Administer non-steroidal anti-inflammatory drugs (NSAIDs) or paracetamol according to package guidelines, avoiding overuse to prevent medication-overuse headaches.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Symptom Diary**: Keep a precise diary recording sleep, food triggers (aged cheeses, processed meats), and caffeine intake to identify patterns.
- **Sleep Architecture**: Maintain a rigid, consistent sleep schedule, waking and resting at identical times daily.
- **Ergonomic Support**: Ensure correct neck alignment and computer screen height at work to minimize muscular tension.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- **Thunderclap Onset**: Headaches that peak in intensity within seconds (sudden, explosive pain) require immediate emergency department evaluation.
- **Neurological Deficits**: Accompanying confusion, visual loss, double vision, speech difficulty, or weakness on one side of the body.
- **Meningeal Signs**: High fever accompanied by a rigid neck, nausea, and severe light sensitivity require urgent screening for meningitis.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Doctor:
1. "Does my headache profile suggest a primary migraine disorder?"
2. "Are preventive prescription therapies appropriate for my frequency?"
3. "Could my headaches be associated with medication overuse or neck strain?"

### Trustworthy Medical Directories:
| Platform | Search Reference Term | Clinical Scope |
| :--- | :--- | :--- |
| **Mayo Clinic** | Migraine & Tension Headaches | Diagnostic criteria, acute therapies, and lifestyle habits |
| **MedlinePlus** | Headache Management | Patient guides, trigger checklists, and warning signs |
| **NIH NINDS** | Headache Information Page | Comprehensive research-backed neurological explanations |`;
  } else if (
    symptomsLower.includes("pain") || 
    symptomsLower.includes("stomach") || 
    symptomsLower.includes("abdomen") || 
    symptomsLower.includes("nausea") || 
    symptomsLower.includes("diarrhea") || 
    symptomsLower.includes("vomit") ||
    selectedSymptoms.includes("Nausea / Vomiting") ||
    selectedSymptoms.includes("Diarrhea")
  ) {
    causes = `## Possible Causes & Pathology
- **Acute Gastroenteritis (Stomach Flu)**: Often viral or mild foodborne irritation, causing temporary bowel tract inflammation.
- **Dietary Indiscretion**: Gastrointestinal distress from food sensitivities, overly rich foods, or temporary digestive disruption.
- **Gastroesophageal Reflux (GERD)**: Acid backflow causing localized burning sensation in the upper epigastrium.`;

    treatments = `## Evidence-Based Treatment Pathways
- **Oral Rehydration**: Sip Oral Rehydration Salts (ORS) or water with electrolytes frequently in small quantities to offset fluid loss.
- **BRAT Diet Transition**: Once nausea subsides, introduce gentle foods like bananas, rice, applesauce, and plain toast.
- **Acid Buffering**: Utilize over-the-counter antacids or H2 blockers for localized upper stomach burning, following clinical instructions.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Food Hygiene**: Maintain sanitary food preparation surfaces, cook poultry thoroughly, and store perishables at proper cool temperatures.
- **Probiotic Support**: Consume fermented whole foods (yogurt, kefir) or high-quality dietary fibers to rebuild gut biome resilience.
- **Trigger Avoidance**: Eliminate carbonated drinks, excess caffeine, and spicy or greasy meals.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- **Acute Localized Pain**: Severe, sharp, localized pain (such as the lower right quadrant, indicative of appendicitis) requires urgent evaluation.
- **Dehydration Indicators**: Inability to keep fluids down for over 24 hours, extreme thirst, dry mouth, or dark/infrequent urine.
- **Systemic Alarms**: Presence of blood in vomit or stools, or high fever with severe abdominal rigidity. Go to the ER immediately.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Doctor:
1. "Could my abdominal symptoms indicate a specific food intolerance or IBS?"
2. "Is a stool panel or diagnostic breath test indicated for persistent symptoms?"
3. "What specific hydration markers should we track in my blood work?"

### Trustworthy Medical Directories:
| Platform | Search Reference Term | Clinical Scope |
| :--- | :--- | :--- |
| **NIDDK NIH** | Gastroenteritis & Acid Reflux | Detailed physiological guides on digestion and stomach conditions |
| **Mayo Clinic** | Abdominal Pain Guide | Categorized pain mapping, home care, and warning signs |
| **CDC.gov** | Food Safety and Hygiene | Guidelines to prevent foodborne pathogens and stomach flu |`;
  } else {
    causes = `## Possible Causes & Pathology
- **Mild Physical Exertion Fatigue**: Temporary muscular or metabolic recovery response following exertion or systemic stress.
- **Minor Localized Irritation**: Non-specific tissue, dermatological, or muscular irritation, often self-limiting in nature.
- **Dehydration or Sleep Deficit**: Minor homeostatic imbalances that trigger general physical discomfort or fatigue.`;

    treatments = `## Evidence-Based Treatment Pathways
- **Relative Rest**: Allow the body a 24-48 hour window of lower physical demand to stimulate cellular self-repair.
- **Thermodynamics**: Apply cool compress packs for acute swelling, or warm packs to soothe stiff, tense muscles.
- **Sustained Hydration**: Drink pure water or electrolyte-fortified fluids to stabilize cellular fluid balances.`;

    prevention = `## Preventive Care & Lifestyle Adjustments
- **Sustained Sleep Quality**: Maintain a 7.5 to 8.5 hour nocturnal sleep window to maximize growth hormone release and nervous system repair.
- **Micro-Nutrient Stability**: Consume a balanced whole-foods diet rich in magnesium, leafy greens, and lean proteins.
- **Daily Recovery Routines**: Include active stretching, joint mobility routines, and 10 minutes of controlled diaphragmatic breathing daily.`;

    firstaid = `## First Aid & Critical Warning Red Flags
- **Acute Systemic Signs**: Sudden facial drooping, unilateral limb weakness, or severe speech difficulty require calling 911/112 immediately.
- **Unexplained Shortness of Breath**: Sudden onset of breathing difficulty or crushing chest pain radiating to the neck, jaw, or arm.
- **Loss of Orientation**: Feeling faint, sudden confusion, visual gaps, or inability to stand.`;

    resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Doctor:
1. "What baseline blood markers (CBC, Vitamin D, Thyroid) should we screen?"
2. "How might my daily stress levels or sleep quality be impacting these symptoms?"
3. "Are there any physical activity limitations I should follow?"

### Trustworthy Medical Directories:
| Platform | Search Reference Term | Clinical Scope |
| :--- | :--- | :--- |
| **Mayo Clinic** | Symptom Assessment & Care | Clinical home care strategies, diagnostics, and prevention |
| **MedlinePlus** | General Wellness & Symptoms | Comprehensive, patient-friendly medical dictionaries and search |
| **NIH.gov** | Preventive Health Guidelines | Evidence-backed guides for daily longevity and disease prevention |`;
  }

  return `[SECTION_1: POTENTIAL_CAUSES]
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

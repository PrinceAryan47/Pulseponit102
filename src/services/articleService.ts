import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { GoogleGenAI, Type } from "./aiService";

const SETTINGS_COLLECTION = 'settings';
const ARTICLE_REFRESH_DOC = 'article_refresh';
const ARTICLES_COLLECTION = 'articles';

export const cleanupOldArticles = async () => {
  try {
    const now = Date.now();
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
    const articlesSnap = await getDocs(collection(db, ARTICLES_COLLECTION));
    const deletePromises = [];

    for (const d of articlesSnap.docs) {
      const data = d.data();
      if (data.createdAt) {
        const createdTime = new Date(data.createdAt).getTime();
        if (!isNaN(createdTime) && now - createdTime > twoWeeksInMs) {
          console.log(`Auto-deleting article older than two weeks: ${d.id} (${data.title})`);
          deletePromises.push(deleteDoc(doc(db, ARTICLES_COLLECTION, d.id)));
        }
      }
    }

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`Cleaned up ${deletePromises.length} old articles.`);
    }
  } catch (error) {
    console.error('Error during old articles cleanup:', error);
  }
};

export const checkAndRefreshArticles = async () => {
  if (typeof window !== 'undefined' && (window as any).firestoreQuotaExceeded) {
    return;
  }
  try {
    // 1. Run automatic cleanup of all articles older than two weeks
    await cleanupOldArticles();

    const refreshDocRef = doc(db, SETTINGS_COLLECTION, ARTICLE_REFRESH_DOC);
    const refreshDoc = await getDoc(refreshDocRef);
    
    const now = Date.now();
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
    
    let shouldRefresh = false;
    
    if (!refreshDoc.exists()) {
      shouldRefresh = true;
    } else {
      const lastRefresh = refreshDoc.data().lastRefresh?.toDate?.()?.getTime() || 0;
      if (now - lastRefresh > twoWeeksInMs) {
        shouldRefresh = true;
      }
    }

    if (shouldRefresh) {
      console.log('Articles are stale. Refreshing...');
      await refreshArticles();
      await setDoc(refreshDocRef, { lastRefresh: serverTimestamp() });
    }
  } catch (error) {
    console.error('Error checking article refresh:', error);
  }
};

const refreshArticles = async () => {
  try {
    // 1. Delete all existing SYSTEM articles
    const articlesSnap = await getDocs(collection(db, ARTICLES_COLLECTION));
    const deletePromises = articlesSnap.docs
      .filter(d => d.data().authorId === 'system')
      .map(d => deleteDoc(doc(db, ARTICLES_COLLECTION, d.id)));
    await Promise.all(deletePromises);

    // 2. Generate new articles using Gemini
    let newArticles: any[] = [];
    try {
      const ai = new GoogleGenAI({ apiKey: '' });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Generate 10 high-quality, evidence-based health and wellness articles for a digital health platform. Each article should include: 1. A catchy title. 2. A 2-sentence summary. 3. A detailed content body in Markdown (at least 600 words) with headings, lists, and professional advice. 4. A category (must be one of: Nutrition, Fitness, Mental Health, Prevention). 5. A reputable primary internet source name (e.g., 'World Health Organization (WHO)', 'Mayo Clinic', 'National Institutes of Health (NIH)', 'CDC Health Advisory', 'NHS Digital'). 6. A realistic reference URL from that source organization to clearly attribute the educational health content and show where readers can verify facts. Keep author/organization professional.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                content: { type: Type.STRING },
                category: { type: Type.STRING },
                sourceName: { type: Type.STRING },
                sourceUrl: { type: Type.STRING },
                authorName: { type: Type.STRING },
              },
              required: ["title", "summary", "content", "category", "sourceName", "sourceUrl"]
            }
          }
        }
      });

      newArticles = JSON.parse(response.text);
    } catch (aiErr) {
      console.warn("Gemini API error during scheduled article refresh, loading pre-defined high-quality articles instead.", aiErr);
      newArticles = FALLBACK_PRESET_ARTICLES;
    }
    
    // 3. Add new articles to Firestore
    const imageKeywords: Record<string, string> = {
      'Nutrition': 'healthy-food',
      'Fitness': 'workout',
      'Mental Health': 'meditation',
      'Prevention': 'medical-checkup'
    };

    const addPromises = newArticles.map((article: any, index: number) => {
      const keyword = imageKeywords[article.category] || 'health';
      return addDoc(collection(db, ARTICLES_COLLECTION), {
        ...article,
        authorName: article.authorName || article.sourceName || 'PulsePoint Medical Team',
        authorId: 'system',
        imageURL: `https://picsum.photos/seed/${keyword}-${index}-${Date.now()}/800/600`,
        createdAt: new Date().toISOString(),
        likes: [],
        comments: []
      });
    });

    await Promise.all(addPromises);
    console.log('Successfully refreshed articles.');
  } catch (error) {
    console.error('Error refreshing articles:', error);
  }
};

const FALLBACK_PRESET_ARTICLES = [
  {
    title: "Optimizing the Gut-Brain Axis: Dietary Pathways to Mental Clarity",
    summary: "Emerging science reveals that the gut and brain communicate continuously. Learn how specific foods can optimize this pathway for improved mood and energy.",
    category: "Nutrition",
    sourceName: "National Institutes of Health (NIH)",
    sourceUrl: "https://www.nih.gov",
    authorName: "NIH Science Team",
    content: "### Understanding the Microbe-Mind Connection\n\nThe gut-brain axis is a bidirectional communication network linking the central nervous system and the enteric nervous system. Over 90% of the body's serotonin receptors are situated within the digestive tract, meaning what you digest deeply influences your neural processing, cognitive focus, and mood stability.\n\nRecent clinical trials demonstrate that patients following high-fiber diets containing diverse prebiotic compounds exhibit lowered indices of anxiety and systemic inflammation.\n\n### Essential Foods for Gut-Brain Harmony\n\n- **Fermented Foods:** Yogurt, kefir, kombucha, and kimchi introduce active probiotic strains directly to the digestive environment.\n- **Polyphenol-Rich Antioxidants:** Blueberries, dark chocolate (70%+), and green tea combat oxidative stress and stimulate signaling pathways in brain tissue.\n- **Prebiotic Fibers:** Leeks, onions, garlic, and wild oats feed existing beneficial microbes, promoting the secretion of sleep-supportive short-chain fatty acids (SCFAs).\n\nIntegrating small, daily portions of fermented and prebiotic foods establishes a reliable physiological shield for long-term emotional and cognitive resilience."
  },
  {
    title: "Cardiovascular Training Myths vs. Science: Building Aerobic Stamina",
    summary: "Discover the scientific truths of cardiovascular fitness. Learn why lower-intensity steady-state training is key to vascular flexibility.",
    category: "Fitness",
    sourceName: "Mayo Clinic",
    sourceUrl: "https://www.mayoclinic.org",
    authorName: "Mayo Clinic Cardiovascular Board",
    content: "### The Power of Low-Intensity Cardio (Zone 2)\n\nA common misconception in fitness communities is that workouts must be high-intensity and painful to yield cardiovascular benefits. However, cellular exercise biology establishes that **Zone 2 training**—training at a pace where you can comfortably converse—is the most efficient way to maximize mitochondrial density.\n\nZone 2 training trains the body to utilize free fatty acids for energy rather than glycogen stores, significantly improving metabolic flexibility and general endurance.\n\n### Designing Your Aerobic Routine\n\n- **Frequency:** Target 3 sessions per week of 30 to 45 minutes.\n- **Intensity Check:** Keep your heart rate at roughly 60% to 70% of your maximum (220 minus your age).\n- **Modality Choice:** Cycling, brisk walking, swimming, or elliptical trainers work exceptionally well.\n\nBuilding an aerobic foundation protects against arterial stiffening, lowers resting heart rates, and boosts daily energy reserves."
  },
  {
    title: "Overcoming Burnout: Scientific Stress Reconstruction for Modern Workplaces",
    summary: "Chronic work-related stress can lead to emotional exhaustion. This article details clinical strategies to rebuild stress tolerance and set boundaries.",
    category: "Mental Health",
    sourceName: "Harvard Medical School",
    sourceUrl: "https://www.health.harvard.edu",
    authorName: "Harvard Health Publishing Team",
    content: "### The Pathophysiology of Chronic Burnout\n\nBurnout is a clinical state of physical and emotional exhaustion caused by prolonged exposure to unmanaged workplace stressors. Chronic high cortisol levels degrade sleep architectures, impair executive decision-making, and suppress immune system responses.\n\nMitigating burnout requires more than simple temporary vacations; it demands systemic recalibration of boundaries and stress-response systems.\n\n### Clinical Reconstruction Techniques\n\n1. **Structured Cognitive Offloading:** Write down immediate concerns, separating actionable tasks from general uncertainties.\n2. **The 5-Minute Brain Reset:** Use slow box breathing techniques for five minutes to activate the parasympathetic branch of the nervous system.\n3. **Rigid Work-Life Boundaries:** Establish strict, non-negotiable times when emails and messaging tools remain inactive.\n\nPrioritizing cognitive recovery and mental boundaries isn't lazy; it's a vital, evidence-based strategy for long-term health and performance."
  },
  {
    title: "The Immunological Power of Sleep: Rebuilding Body Defenses",
    summary: "Sleep is the primary restorative cycle for the human immune system. Learn how quality rest controls immune signaling pathways.",
    category: "Prevention",
    sourceName: "CDC Health Advisory",
    sourceUrl: "https://www.cdc.gov",
    authorName: "CDC Health Prevention",
    content: "### How Deep Sleep Feeds Your Immune System\n\nDuring deep non-REM sleep, the human brain releases growth hormones, while the immune system produces and releases a type of protein called **cytokines**. Certain cytokines play a key role in orchestrating defense responses against local infections and chronic inflammation.\n\nChronically sleeping less than 6 hours per night diminishes crucial antibody production, making one highly susceptible to common viruses and decelerating recovery cycles.\n\n### Building the Perfect Sleep Sanctuary\n\n- **Light Control:** Use blackout curtains or eye masks. Screen exposures should stop 60 minutes before bedtime.\n- **Temperature:** Keep room temperatures slightly cool (between 16°C and 19°C) to support core body cooling matches.\n- **Routine Consistency:** Bedtime and wake times should remain identical, even on weekends.\n\nQuality rest is a critical pillar of preventive care. Protect your sleep as carefully as you protect your nutrition."
  },
  {
    title: "A Comprehensive Guide to Complete Proteins and Amino Acid Profiles",
    summary: "Understand how to pair plant-based and whole superfoods to unlock complete amino acid structures for metabolic synthesis.",
    category: "Nutrition",
    sourceName: "NHS Digital",
    sourceUrl: "https://www.nhs.uk",
    authorName: "NHS Nutritionists",
    content: "### The Biochemistry of Essential Amino Acids\n\nTo build and repair protein-based tissues, the human body requires 20 distinct amino acids. Nine of these are **essential**, meaning the body cannot produce them and they must be introduced through diet.\n\nAnimal proteins are naturally 'complete' because they contain all nine essential amino acids in biological balances. If you eat a plant-based diet, you can unlock full protein synthesis by pairing complementary foods.\n\n### Powerful Synergistic Food Pairings\n\n- **Grains and Legumes:** Brown rice with black beans, or whole-wheat toast with peanut butter.\n- **Seeds and Grains:** Millet paired with sunflower seeds.\n- **Soja and Quinoa:** Excellent stand-alone complete plant proteins.\n\nConsuming a variety of wholesome grains, seeds, and legumes throughout the day provides a complete amino acid profile, promoting muscle health and cellular repair."
  },
  {
    title: "Adult Screening Timelines: Choosing Preemptive Diagnostic Milestones",
    summary: "A medically reviewed guide outlining the specific age-based checkups and tests every adult should complete annually.",
    category: "Prevention",
    sourceName: "World Health Organization (WHO)",
    sourceUrl: "https://www.who.int",
    authorName: "WHO Health Guidelines Dept.",
    content: "### Precision Medicine: Screening is Your Shield\n\nCatching anomalies early remains the absolute gold standard of defensive medicine. Many progressive conditions, such as colorectal cancers or hypertension, develop silently without obvious symptoms. Regular diagnostic checks can stop them early.\n\nDiagnostic schedules are defined by age, family history, and lifestyle risk factors.\n\n### Vital Annual Milestones\n\n- **Blood Pressure Checks:** Every adult should check their blood pressure annually starting at age 18.\n- **Cholesterol Panel (Lipids):** Every 4 to 6 years starting at age 20 to track cardiovascular risks.\n- **Colorectal Cancer Screenings:** Highly recommended for all adults starting at age 45.\n\nConsulting a modern family practitioner once a year to run a customized blood panel gives you the data you need to make proactive choices."
  }
];

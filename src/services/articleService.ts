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
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Generate 10 high-quality, evidence-based health and wellness articles for a digital health platform. Each article should include: 1. A catchy title. 2. A 2-sentence summary. 3. A detailed content body in Markdown (at least 600 words) with headings, lists, and professional advice. 4. A category (must be one of: Nutrition, Fitness, Mental Health, Prevention). 5. A realistic author name. The authors should be a mix of medical professionals (e.g., 'Dr. Sarah Chen') and globally recognized health organizations (e.g., 'World Health Organization (WHO)', 'Mayo Clinic', 'NHS Digital', 'CDC Health Advisory'). Ensure the content is strictly evidence-based and follows international medical standards.",
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
              authorName: { type: Type.STRING },
            },
            required: ["title", "summary", "content", "category", "authorName"]
          }
        }
      }
    });

    const newArticles = JSON.parse(response.text);
    
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

import { GoogleGenAI, Type } from "@google/genai";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
  category: string;
  imageURL: string;
  sourceName?: string;
  sourceUrl?: string;
}

export const generateHealthNews = async (): Promise<GeneratedArticle[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Perform a comprehensive search for the most recent and trending health news globally and specifically in East Africa (Uganda, Kenya, Tanzania). Find 10 unique stories from the last 7 days covering medical breakthroughs, public health alerts, wellness trends, and nutritional science. For each story, you MUST provide: 1. A catchy title. 2. A short summary (2-3 sentences). 3. The full content in detailed paragraphs (at least 3-4 paragraphs) in Markdown. 4. A relevant category (Nutrition, Fitness, Mental Health, Prevention, Medical Discovery, or Public Health). 5. A high-quality relevant image URL from Unsplash. 6. The real direct news website or medical journal name (e.g., 'BBC Health', 'World Health Organization', 'The Lancet', 'Mayo Clinic') as `sourceName` based on the search results. 7. A precise, realistic URL of the source article as `sourceUrl` (e.g., 'https://www.who.int/...', 'https://www.nature.com/...'). Return the data as a JSON array of objects.",
      config: {
        tools: [{ googleSearch: {} }],
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
              imageURL: { type: Type.STRING },
              sourceName: { type: Type.STRING },
              sourceUrl: { type: Type.STRING }
            },
            required: ["title", "summary", "content", "category", "imageURL", "sourceName", "sourceUrl"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating health news:", error);
    throw error;
  }
};

export const publishGeneratedNews = async (articles: GeneratedArticle[], authorId: string, authorName: string) => {
  const articlesRef = collection(db, 'articles');
  
  const publishPromises = articles.map(article => {
    return addDoc(articlesRef, {
      ...article,
      authorId: 'system', // Show it is powered by internet/system sourcing
      authorName: article.sourceName || 'Global Medical Source',
      sourceName: article.sourceName || 'Unknown Source',
      sourceUrl: article.sourceUrl || '',
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    });
  });
  
  await Promise.all(publishPromises);
};

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
}

export const generateHealthNews = async (): Promise<GeneratedArticle[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Perform a comprehensive search for the most recent and trending health news globally and specifically in East Africa (Uganda, Kenya, Tanzania). Find 10 unique stories from the last 7 days covering medical breakthroughs, public health alerts, wellness trends, and nutritional science. For each story, provide a title, a short summary (2-3 sentences), the full content (at least 3-4 detailed paragraphs), a relevant category (Nutrition, Fitness, Mental Health, Prevention, Medical Discovery, or Public Health), and a high-quality relevant image URL from Unsplash. Ensure the news is diverse and covers both high-tech medicine and community health. Return the data as a JSON array of objects.",
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
              imageURL: { type: Type.STRING }
            },
            required: ["title", "summary", "content", "category", "imageURL"]
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
      authorId,
      authorName,
      createdAt: serverTimestamp(),
      likes: [],
      comments: []
    });
  });
  
  await Promise.all(publishPromises);
};

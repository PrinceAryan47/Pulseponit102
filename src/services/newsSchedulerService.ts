import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { generateHealthNews, publishGeneratedNews } from "./newsAiService";

export const checkAndTriggerAutoNews = async (adminId: string, adminName: string) => {
  try {
    const settingsRef = doc(db, 'settings', 'news_config');
    const settingsDoc = await getDoc(settingsRef);
    
    const now = new Date();
    let shouldUpdate = false;
    
    if (!settingsDoc.exists()) {
      shouldUpdate = true;
    } else {
      const data = settingsDoc.data();
      if (data.autoGenerate) {
        const lastUpdate = data.lastUpdate?.toDate();
        if (lastUpdate) {
          const diffDays = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays >= 7) {
            shouldUpdate = true;
          }
        } else {
          shouldUpdate = true;
        }
      }
    }
    
    if (shouldUpdate) {
      console.log("Triggering automatic weekly news generation...");
      const news = await generateHealthNews();
      await publishGeneratedNews(news, adminId, adminName);
      await setDoc(settingsRef, {
        lastUpdate: serverTimestamp(),
        autoGenerate: settingsDoc.exists() ? settingsDoc.data().autoGenerate : true
      }, { merge: true });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error in auto news scheduler:", error);
    return false;
  }
};

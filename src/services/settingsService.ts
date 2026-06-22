import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const getAppSetting = async (key: string) => {
  if (typeof window !== 'undefined' && (window as any).firestoreQuotaExceeded) {
    return null;
  }
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      const docRef = doc(db, 'settings', key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().value;
      }
      return null;
    } catch (error: any) {
      console.warn(`Attempt ${attempts + 1} failed to get setting ${key}:`, error.message);
      const errMsg = error.message.toLowerCase();
      if (errMsg.includes('quota') || errMsg.includes('resource-exhausted') || error.code === 'resource-exhausted') {
        if (typeof window !== 'undefined') {
          (window as any).firestoreQuotaExceeded = true;
          localStorage.setItem('firestoreQuotaExceeded', 'true');
          window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
        }
        return null;
      }
      if (error.message.includes('offline') || error.code === 'unavailable') {
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }
};

export const setAppSetting = async (key: string, value: any) => {
  if (typeof window !== 'undefined' && (window as any).firestoreQuotaExceeded) {
    return;
  }
  try {
    await setDoc(doc(db, 'settings', key), { value, updatedAt: new Date().toISOString() });
  } catch (error: any) {
    const errMsg = error.message.toLowerCase();
    if (errMsg.includes('quota') || errMsg.includes('resource-exhausted') || error.code === 'resource-exhausted') {
      if (typeof window !== 'undefined') {
        (window as any).firestoreQuotaExceeded = true;
        localStorage.setItem('firestoreQuotaExceeded', 'true');
        window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
      }
      return;
    }
    if (error.code === 'permission-denied') {
      // Silently ignore permission errors during initialization for non-admins
      return;
    }
    console.error(`Error setting ${key}:`, error);
  }
};

// Initialize default settings
export const initializeSettings = async () => {
  if (typeof window !== 'undefined' && (window as any).firestoreQuotaExceeded) {
    return;
  }
  const heroImage = await getAppSetting('heroImage');
  if (!heroImage) {
    // Use a high-quality medical image as the default
    await setAppSetting('heroImage', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000');
  }
};

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Use initializeFirestore with robust settings to avoid connection issues in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
}, firebaseConfig.firestoreDatabaseId);

let messagingInstance: any = null;
isSupported().then((supported) => {
  if (supported) {
    messagingInstance = getMessaging(app);
  }
}).catch(err => console.log("Firebase Messaging is not supported or blocked in this browser environment", err));

export const getFirebaseMessaging = () => messagingInstance;

// Test connection
async function testConnection() {
  if (typeof window !== 'undefined' && localStorage.getItem('firestoreQuotaExceeded') === 'true') {
    (window as any).firestoreQuotaExceeded = true;
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection successful");
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. The client is offline.");
      }
      const errMsg = error.message.toLowerCase();
      if (errMsg.includes('quota') || errMsg.includes('resource-exhausted') || error.message.includes('exhausted') || (error as any).code === 'resource-exhausted') {
        console.warn("Firestore quota limit exceeded detected.");
        (window as any).firestoreQuotaExceeded = true;
        if (typeof window !== 'undefined') {
          localStorage.setItem('firestoreQuotaExceeded', 'true');
          window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
        }
      }
    }
  }
}

testConnection();

// Global listeners to automatically intercept quota limit errors and transition to demo mode smoothly
if (typeof window !== 'undefined') {
  // Pre-load from localStorage
  if (localStorage.getItem('firestoreQuotaExceeded') === 'true') {
    (window as any).firestoreQuotaExceeded = true;
  }

  const handleQuotaError = (error: any) => {
    if (!error) return;
    const msg = String(error.message || error || '').toLowerCase();
    const code = String(error.code || '').toLowerCase();
    if (
      msg.includes('quota') || 
      msg.includes('resource-exhausted') || 
      msg.includes('exhausted') || 
      code.includes('resource-exhausted') || 
      code.includes('quota') ||
      code.includes('permission-denied')
    ) {
      if (!(window as any).firestoreQuotaExceeded) {
        console.warn("Global interception: Firestore quota limit exceeded. Seamlessly activating demo fallback.");
        (window as any).firestoreQuotaExceeded = true;
        localStorage.setItem('firestoreQuotaExceeded', 'true');
        window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
      }
    }
  };

  window.addEventListener('unhandledrejection', (event) => {
    handleQuotaError(event.reason);
  });

  window.addEventListener('error', (event) => {
    handleQuotaError(event.error);
  });
}

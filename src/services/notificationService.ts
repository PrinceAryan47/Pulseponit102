import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const createNotification = async (userId: string, title: string, message: string, type: 'appointment' | 'message' | 'alert') => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

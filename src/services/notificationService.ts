import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ConsentScope } from '../types';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'message' | 'alert' | 'consent_request';
  requestId?: string;
  doctorId?: string;
  doctorName?: string;
  requestedScopes?: ConsentScope[];
  purpose?: string;
}

export const createNotification = async (
  userId: string, 
  title: string, 
  message: string, 
  type: 'appointment' | 'message' | 'alert' | 'consent_request' = 'alert',
  metadata?: Partial<NotificationPayload>
) => {
  try {
    const docData: Record<string, any> = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
    };

    if (metadata?.requestId) docData.requestId = metadata.requestId;
    if (metadata?.doctorId) docData.doctorId = metadata.doctorId;
    if (metadata?.doctorName) docData.doctorName = metadata.doctorName;
    if (metadata?.requestedScopes) docData.requestedScopes = metadata.requestedScopes;
    if (metadata?.purpose) docData.purpose = metadata.purpose;

    await addDoc(collection(db, 'notifications'), docData);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};


import React, { useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

export const UserStatusManager: React.FC = () => {
  const { user, profile, isAuthReady } = useAuth();
  
  useEffect(() => {
    if (!user || !isAuthReady || !profile) return;
    
    const userRef = doc(db, 'users', user.uid);
    
    // Set online/offline status
    const updateOnlineStatus = (online: boolean) => {
      if ((window as any).firestoreQuotaExceeded) {
        return;
      }
      // Ensure user is still actively authenticated in Firebase before attempting Firestore write
      if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
        return;
      }

      updateDoc(userRef, {
        isOnline: online,
        lastSeen: serverTimestamp()
      }).catch(err => {
        if (err instanceof Error) {
          const errMsg = err.message.toLowerCase();
          if (errMsg.includes('quota') || errMsg.includes('resource-exhausted') || errMsg.includes('exhausted')) {
            (window as any).firestoreQuotaExceeded = true;
            window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
            return;
          }
          // Ignore benign errors during teardown, logout, or race conditions
          if (
            errMsg.includes('permission') || 
            errMsg.includes('no document to update') ||
            errMsg.includes('insufficient permissions')
          ) {
            return;
          }
          console.error(`Error updating ${online ? 'online' : 'offline'} status:`, err);
        }
      });
    };

    updateOnlineStatus(true);
    
    // Heartbeat every 2 minutes
    const heartbeatInterval = setInterval(() => {
      updateOnlineStatus(true);
    }, 2 * 60 * 1000);
    
    // Set offline status on unmount
    const handleVisibilityChange = () => {
      updateOnlineStatus(document.visibilityState === 'visible');
    };

    window.addEventListener('beforeunload', () => {
      updateOnlineStatus(false);
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(heartbeatInterval);
      if (userRef) {
        updateOnlineStatus(false);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.uid, isAuthReady, !!profile]);
  
  return null;
};

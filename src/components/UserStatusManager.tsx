import React, { useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export const UserStatusManager: React.FC = () => {
  const { user, profile, isAuthReady } = useAuth();
  
  useEffect(() => {
    if (!user || !isAuthReady) return;
    
    const userRef = doc(db, 'users', user.uid);
    
    // Set online status
    const updateOnlineStatus = (online: boolean) => {
      updateDoc(userRef, {
        isOnline: online,
        lastSeen: serverTimestamp()
      }).catch(err => {
        // Ignore "No document to update" errors if they happen during race conditions
        if (err instanceof Error && !err.message.includes('No document to update')) {
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
  }, [user?.uid, isAuthReady]);
  
  return null;
};

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, getDocFromServer, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

export const SUPER_ADMIN_EMAILS = [
  "mafia.lord1247@gmail.com",
  "kyleisrael44@gmail.com",
  "prince47aryan@gmail.com"
];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  isSuperAdmin: boolean;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  isSuperAdmin: false,
  refreshProfile: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const checkIsAdmin = useCallback((email?: string | null, role?: string) => {
    if (!email) return role === 'admin';
    const normalized = email.toLowerCase().trim();
    return SUPER_ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalized) || role === 'admin';
  }, []);

  const isSuperAdmin = checkIsAdmin(user?.email, profile?.role);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!auth.currentUser) return null;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const snap = await getDocFromServer(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        return data;
      }
    } catch (err) {
      console.warn("Could not fetch profile directly from server, relying on local snapshot:", err);
    }
    return profile;
  }, [profile]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      if (firebaseUser) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('firestoreQuotaExceeded');
          (window as any).firestoreQuotaExceeded = false;
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const userRef = doc(db, 'users', user.uid);

    const unsubscribeProfile = onSnapshot(
      userRef,
      async (docSnap) => {
        if (!isMounted) return;

        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          const isAdminUser = checkIsAdmin(user.email, profileData.role);

          // If user is a superadmin email but marked as patient, upgrade in Firestore
          if (isAdminUser && profileData.role !== 'admin') {
            profileData.role = 'admin';
            try {
              await updateDoc(userRef, {
                role: 'admin',
                status: 'approved',
                lastSeen: serverTimestamp()
              });
            } catch (e) {
              console.warn("Could not update role in Firestore:", e);
            }
          }

          setProfile(profileData);
          setLoading(false);
        } else {
          // Profile doc doesn't exist for user.uid yet
          // Check if an existing profile doc matches this user's email or dot-variant
          try {
            const userEmail = user.email?.toLowerCase().trim() || '';
            const strippedEmail = userEmail.replace(/\./g, '');
            
            const usersSnap = await getDocs(collection(db, 'users'));
            let matchedDoc: any = null;

            usersSnap.forEach((d) => {
              const dEmail = (d.data().email || '').toLowerCase().trim();
              if (dEmail === userEmail || dEmail.replace(/\./g, '') === strippedEmail) {
                matchedDoc = { id: d.id, ...d.data() };
              }
            });

            const isAdmin = checkIsAdmin(user.email);
            const initialRole = isAdmin ? 'admin' : (matchedDoc?.role || 'patient');

            const newProfile: any = {
              uid: user.uid,
              email: user.email || '',
              fullName: user.displayName || matchedDoc?.fullName || (isAdmin ? 'Admin' : 'User'),
              role: initialRole,
              status: 'approved',
              phoneNumber: user.phoneNumber || matchedDoc?.phoneNumber || '',
              photoURL: user.photoURL || matchedDoc?.photoURL || '',
              gender: matchedDoc?.gender || 'male',
              createdAt: matchedDoc?.createdAt || serverTimestamp(),
              lastSeen: serverTimestamp(),
              isOnline: true,
            };

            if (matchedDoc?.specialization) newProfile.specialization = matchedDoc.specialization;
            if (matchedDoc?.licenseNumber) newProfile.licenseNumber = matchedDoc.licenseNumber;
            if (matchedDoc?.hospitalId) newProfile.hospitalId = matchedDoc.hospitalId;
            if (matchedDoc?.hospitalName) newProfile.hospitalName = matchedDoc.hospitalName;

            await setDoc(userRef, newProfile);
            setProfile(newProfile as UserProfile);

            // Also ensure email is registered in emails collection
            if (user.email) {
              await setDoc(doc(db, 'emails', user.email.toLowerCase()), {
                email: user.email.toLowerCase(),
                uid: user.uid,
                createdAt: serverTimestamp()
              }, { merge: true });
            }
          } catch (createErr) {
            console.warn("Failed to auto-create profile doc:", createErr);
          } finally {
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribeProfile();
    };
  }, [user, checkIsAdmin]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, isSuperAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

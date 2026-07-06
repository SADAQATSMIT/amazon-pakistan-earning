import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: User | null;
  userData: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  setMasterAuthorized: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
  setMasterAuthorized: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMasterAuthorized, setIsMasterAuthorized] = useState(() => {
    return sessionStorage.getItem('is_admin_session') === 'true';
  });

  const setMasterAuthorized = (val: boolean) => {
    setIsMasterAuthorized(val);
    if (val) {
      sessionStorage.setItem('is_admin_session', 'true');
    } else {
      sessionStorage.removeItem('is_admin_session');
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Listen for user data changes
        const unsubscribe = onSnapshot(doc(db, 'users', authUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data() as AppUser);
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("User data listener error:", error);
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
  }, []);

  const isAdmin = userData?.role === 'admin' || user?.email === 'skb2720305@gmail.com' || isMasterAuthorized;

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, setMasterAuthorized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

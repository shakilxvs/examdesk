import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'teachers', firebaseUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setTeacher({ id: snap.id, ...snap.data() });
          }
        } catch (err) {
          console.error('Error fetching teacher profile:', err);
        }
      } else {
        setTeacher(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshTeacher = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'teachers', user.uid));
    if (snap.exists()) setTeacher({ id: snap.id, ...snap.data() });
  };

  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, teacher, loading, signOut, refreshTeacher }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

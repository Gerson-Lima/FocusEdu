import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "@/firebase";

type UserData = {
  uid: string;
  email: string | null;
  name: string;
  photoURL?: string | null;
};

type AuthContextValue = {
  userData: UserData | null;
  currentUser: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
};

const MockAuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapUser(user: User): UserData {
  return {
    uid: user.uid,
    email: user.email,
    name:
      user.displayName ||
      (user.email ? user.email.split("@")[0] : "Usuário"),
  };
}

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      
      try {
        if (user) {
          await user.reload();
          const token = await user.getIdToken();
          localStorage.setItem("token", token);
          if (mounted) {
            setUserData(mapUser(user));
          }
        } else {
          localStorage.removeItem("token");
          if (mounted) {
            setUserData(null);
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        if (mounted) {
          setUserData(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }, (error) => {
      console.error('Auth state change error:', error);
      if (mounted) {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      await user.reload();

      const token = await user.getIdToken();
      localStorage.setItem("token", token);
      setUserData(mapUser(user));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem("token");
    setUserData(null);
  };

  return (
    <MockAuthContext.Provider
      value={{
        userData,
        currentUser: userData,
        loading,
        signIn,
        signOut,
        logout: signOut,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

// preferred hook name for Firebase-backed auth
export const useFirebaseAuth = () => {
  const ctx = useContext(MockAuthContext);
  if (!ctx) {
    throw new Error("useMockAuth deve ser usado dentro de MockAuthProvider");
  }
  return ctx;
};

// backward-compatible aliases (will be removed in future)
export const MockAuthProvider = FirebaseAuthProvider;
export const useMockAuth = useFirebaseAuth;

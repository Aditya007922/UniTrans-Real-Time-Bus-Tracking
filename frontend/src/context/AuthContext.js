import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  linkWithCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password, rememberMe = false) {
    try {
      console.log("Attempting login for:", email);
      
      // Set persistence based on Remember Me
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      const res = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login method
      await updateDoc(doc(db, "users", res.user.uid), {
        lastLoginMethod: 'email',
        lastLoginAt: new Date().toISOString()
      });
      
      return res;
    } catch (error) {
      console.error("Login Error:", error.code, error.message);
      throw error;
    }
  }

  async function signup(email, password, name, role, phoneNumber = null) {
    try {
      console.log("Attempting signup for:", email, "with role:", role);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;
      console.log("Auth user created:", user.uid);
      
      // Create user profile in Firestore
      try {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name,
          email,
          role,
          phoneNumber,
          phoneVerified: false,
          lastLoginMethod: 'email',
          createdAt: new Date().toISOString()
        });
        console.log("Firestore profile created for:", user.uid);
      } catch (fsError) {
        console.error("Firestore Profile Creation Error:", fsError.code, fsError.message);
        // We continue because the auth user was already created
      }
      
      return res;
    } catch (error) {
      console.error("Signup Error:", error.code, error.message);
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function setUpRecaptcha(containerId) {
    if (!auth) return;
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
    return recaptchaVerifier;
  }

  async function signInWithPhone(phoneNumber, verifier) {
    try {
      return await signInWithPhoneNumber(auth, phoneNumber, verifier);
    } catch (error) {
      console.error("Phone Auth Error:", error);
      throw error;
    }
  }

  async function linkPhoneToAccount(user, credential) {
    try {
      const result = await linkWithCredential(user, credential);
      // Update Firestore after linking
      await updateDoc(doc(db, "users", user.uid), {
        phoneNumber: user.phoneNumber,
        phoneVerified: true
      });
      return result;
    } catch (error) {
      console.error("Link Phone Error:", error);
      throw error;
    }
  }

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && db) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
          setCurrentUser({ ...user, ...docSnap.data() });
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    signup,
    logout,
    resetPassword,
    setUpRecaptcha,
    signInWithPhone,
    linkPhoneToAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

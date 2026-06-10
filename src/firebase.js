import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId:     process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  databaseURL:       process.env.REACT_APP_FIREBASE_DATABASE_URL,
};

export const app       = initializeApp(firebaseConfig);
export const auth      = getAuth(app);
export const db        = getFirestore(app);
export const storage   = getStorage(app);
export const rtdb      = getDatabase(app);

/**
 * Re-authenticates the current seller via Firebase Auth using their stored
 * credentials (only if they have a valid session in localStorage).
 * NOTE: plainPassword is a legacy field; new sellers authenticate normally.
 */
export const refreshFirebaseAuthSession = async () => {
  try {
    const sellerId    = localStorage.getItem('sellerId');
    const sellerEmail = localStorage.getItem('sellerEmail');
    if (!sellerId || !sellerEmail) return false;

    if (auth.currentUser && auth.currentUser.email === sellerEmail) {
      return true;
    }

    try {
      const sellerDoc = await getDoc(doc(db, 'sellers', sellerId));
      if (!sellerDoc.exists()) return false;
      const sellerData  = sellerDoc.data();
      const plainPassword = sellerData.plainPassword || sellerData.password;
      if (plainPassword && sellerEmail) {
        await signInWithEmailAndPassword(auth, sellerEmail, plainPassword);
        return true;
      }
    } catch {
      return false;
    }
  } catch {
    return false;
  }
  return false;
};

let adminCreationAttempted = false;

const ADMIN_EMAIL    = process.env.REACT_APP_ADMIN_EMAIL    || 'manomano@gmail.com';
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || '123and123';

export const createAdminUser = async () => {
  if (adminCreationAttempted) return;
  adminCreationAttempted = true;
  try {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      const adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
      if (!adminDoc.exists()) {
        await setDoc(doc(db, 'admins', userCredential.user.uid), {
          email: ADMIN_EMAIL,
          role: 'admin',
          createdAt: new Date().toISOString(),
        });
      }
      await auth.signOut();
    } catch (signInError) {
      if (
        signInError.code === 'auth/user-not-found' ||
        signInError.code === 'auth/invalid-credential'
      ) {
        const newAdminCredential = await createUserWithEmailAndPassword(
          auth, ADMIN_EMAIL, ADMIN_PASSWORD
        );
        await setDoc(doc(db, 'admins', newAdminCredential.user.uid), {
          email: ADMIN_EMAIL,
          role: 'admin',
          createdAt: new Date().toISOString(),
        });
        await auth.signOut();
      }
    }
  } catch (error) {
    if (error.code !== 'auth/email-already-in-use') {
      console.error('Error in admin setup:', error);
    }
  }
};

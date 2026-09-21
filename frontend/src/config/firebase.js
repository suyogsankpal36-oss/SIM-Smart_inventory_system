import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCKe_dNIdNRAJwxNKf1MP9wt1NeXYUffAE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-ims-e6bcf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-ims-e6bcf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-ims-e6bcf.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "321770080573",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:321770080573:web:65e4505750ca21141a5d54",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-P7GMDYG6XK",
};

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Trigger authentic Google Sign-In popup with Firebase Auth
 */
export const signInWithGooglePopup = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const idToken = await user.getIdToken();

  return {
    user,
    email: user.email,
    name: user.displayName || "",
    picture: user.photoURL || "",
    sub: user.uid,
    token: idToken,
  };
};

/**
 * Optional: Google Sign-In via full-page redirect (bypasses all popup/COOP checks entirely)
 */
export const signInWithGoogleRedirect = async () => {
  return await signInWithRedirect(auth, googleProvider);
};

export const checkRedirectResult = async () => {
  const result = await getRedirectResult(auth);
  if (!result?.user) return null;
  const user = result.user;
  const idToken = await user.getIdToken();
  return {
    user,
    email: user.email,
    name: user.displayName || "",
    picture: user.photoURL || "",
    sub: user.uid,
    token: idToken,
  };
};

export default app;

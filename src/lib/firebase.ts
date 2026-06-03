import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const placeholderValues = new Set([
  "YOUR_API_KEY",
  "YOUR_PROJECT.firebaseapp.com",
  "YOUR_PROJECT_ID",
  "YOUR_PROJECT.appspot.com",
  "YOUR_SENDER_ID",
  "YOUR_APP_ID",
]);

const missingConfig = Object.entries(firebaseConfig).filter(
  ([, value]) => !value || placeholderValues.has(value.trim()),
);

if (missingConfig.length > 0) {
  const missingKeys = missingConfig.map(([key]) => key).join(", ");
  throw new Error(
    `Firebase config is missing or invalid. Set the following environment variables in .env: ${missingKeys}`,
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    if ((error as { code?: string })?.code === "auth/operation-not-allowed") {
      console.error(
        "Google sign-in is disabled in Firebase Authentication. Enable Google provider in the Firebase console under Authentication > Sign-in method.",
      );
    }
    throw error;
  }
};
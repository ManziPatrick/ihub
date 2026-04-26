import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCXbis7wKU3IAcUrjyLTrVXKiIoW1CSpuM",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ihub-d218d.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ihub-d218d",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ihub-d218d.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "665960152507",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:665960152507:web:4e27850283a1065074989e",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-67XBBGTM1Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };

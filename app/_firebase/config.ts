import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase solo si no hay apps ya inicializadas
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Habilitar persistencia offline cuando estamos en el navegador
if (typeof window !== "undefined") {
  // Habilitar persistencia en IndexedDB
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("Persistencia offline habilitada");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn("La persistencia falló porque hay múltiples pestañas abiertas");
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required.
        console.warn("El navegador actual no soporta todas las características necesarias para la persistencia");
      } else {
        console.error("Error habilitando persistencia:", err);
      }
    });
}

// Analytics can only be used on the client side
let analytics = null;
if (typeof window !== "undefined") {
  // Import analytics dynamically to avoid SSR issues
  import("firebase/analytics").then((module) => {
    const { getAnalytics } = module;
    analytics = getAnalytics(app);
  });
}

export { app, auth, db, storage, analytics };
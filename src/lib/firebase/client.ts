"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

let emulatorsConnected = false;

export function getClientFirebase() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error(
      "Firebase browser configuration is missing. Copy .env.example to .env and configure the local emulator values.",
    );
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (typeof window !== "undefined" && !emulatorsConnected) {
    const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
    if (authHost) {
      connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
    }

    const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;
    if (firestoreHost) {
    const [host, port] = firestoreHost.split(":");
      connectFirestoreEmulator(db, host, Number(port));
    }

    emulatorsConnected = true;
  }

  return { auth, db };
}

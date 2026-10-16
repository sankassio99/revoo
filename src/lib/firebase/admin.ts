import "server-only";

import { applicationDefault, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function initializeAdminApp() {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID must be configured on the server.");
  }

  const isEmulated = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST,
  );

  return initializeApp({
    ...(isEmulated ? {} : { credential: applicationDefault() }),
    projectId,
  });
}

const app = getApps().length > 0 ? getApp() : initializeAdminApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

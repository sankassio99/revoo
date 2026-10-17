import "server-only";

import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
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

  return initializeApp({
    credential: resolveCredential(projectId),
    projectId,
  });
}

// Vercel has no credential file: use env vars, falling back to ADC locally.
function resolveCredential(projectId: string) {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const parsed = JSON.parse(json) as { client_email: string; private_key: string };
    return cert({
      projectId,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    });
  }

  return applicationDefault();
}

const app = getApps().length > 0 ? getApp() : initializeAdminApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

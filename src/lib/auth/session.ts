import "server-only";

import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { logger } from "@/lib/observability/logger";

const cookieName = process.env.SESSION_COOKIE_NAME ?? "__session";
const invalidSessionCodes = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/invalid-session-cookie",
  "auth/session-cookie-expired",
  "auth/user-disabled",
  "auth/user-not-found",
]);

export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cookieName)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
      emailVerified: decoded.email_verified === true,
    };
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error &&
      typeof error.code === "string"
        ? error.code
        : undefined;
    if (code && invalidSessionCodes.has(code)) {
      return null;
    }
    logger.error("auth.session_verification_failed", { code });
    throw error;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Authentication is required.");
  }
  return user;
}

export function getSessionCookieName() {
  return cookieName;
}

export function getSessionCookieMaxAge() {
  const maxAge = Number(process.env.SESSION_COOKIE_MAX_AGE_SECONDS ?? 432000);
  if (!Number.isSafeInteger(maxAge) || maxAge < 60 || maxAge > 1209600) {
    throw new Error("SESSION_COOKIE_MAX_AGE_SECONDS must be between 60 and 1209600.");
  }
  return maxAge;
}

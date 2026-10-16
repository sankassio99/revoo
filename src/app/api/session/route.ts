import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { adminDb } from "@/lib/firebase/admin";
import { logger } from "@/lib/observability/logger";
import { FieldValue } from "firebase-admin/firestore";
import {
  getSessionCookieMaxAge,
  getSessionCookieName,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("idToken" in body) ||
    typeof body.idToken !== "string"
  ) {
    return NextResponse.json({ error: "A valid sign-in token is required." }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(body.idToken, true);
    if (decoded.email_verified !== true) {
      return NextResponse.json(
        { error: "Verify your email before starting a Revoo session." },
        { status: 403 },
      );
    }
    const ageSeconds = Math.floor(Date.now() / 1000) - decoded.auth_time;

    if (ageSeconds > 5 * 60 || ageSeconds < 0) {
      return NextResponse.json(
        { error: "Please sign in again to create a secure session." },
        { status: 401 },
      );
    }

    const maxAge = getSessionCookieMaxAge();
    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
      expiresIn: maxAge * 1000,
    });
    await adminDb.doc(`users/${decoded.uid}`).set(
      {
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    const response = NextResponse.json({ ok: true });
    response.cookies.set(getSessionCookieName(), sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error) {
    logger.error("auth.session_creation_failed", {
      code:
        typeof error === "object" && error !== null && "code" in error &&
        typeof error.code === "string"
          ? error.code
          : undefined,
    });
    return NextResponse.json(
      { error: "We could not verify your sign-in. Please try again." },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

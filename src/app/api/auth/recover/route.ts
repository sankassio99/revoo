import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

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
    !("email" in body) ||
    typeof body.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
  ) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    await adminAuth.getUserByEmail(body.email.trim().toLowerCase());
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code !== "auth/user-not-found") {
      console.error("Unable to validate password-recovery request.", error);
      return NextResponse.json(
        { error: "Password recovery is temporarily unavailable." },
        { status: 503 },
      );
    }
  }

  return NextResponse.json({
    message: "If that account exists, Firebase will deliver password recovery instructions.",
  });
}

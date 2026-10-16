import { NextResponse } from "next/server";
import {
  createAppointment,
  updateAppointment,
} from "@/features/appointments/appointment.service";
import { getSessionUser } from "@/lib/auth/session";
import { logger } from "@/lib/observability/logger";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to create appointments." }, { status: 401 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const { tenantId } = await params;
  try {
    const appointment = await createAppointment(user, tenantId, input);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return appointmentError(error, tenantId, user.uid, "create");
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to update appointments." }, { status: 401 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const { tenantId } = await params;
  try {
    const result = await updateAppointment(user, tenantId, input);
    return NextResponse.json(result);
  } catch (error) {
    return appointmentError(error, tenantId, user.uid, "update");
  }
}

function appointmentError(
  error: unknown,
  tenantId: string,
  userId: string,
  operation: "create" | "update",
) {
  const message = error instanceof Error ? error.message : "Unknown failure";
  const forbidden = message.includes("do not have access");
  const notFound = message === "Appointment not found.";
  const conflict = message.includes("overlapping appointment");
  const invalid =
    message.startsWith("Choose ") ||
    message.startsWith("Set ") ||
    message.startsWith("Appointments ") ||
    message.startsWith("The full appointment") ||
    message.startsWith("The selected service") ||
    message.startsWith("The appointment professional") ||
    message.startsWith("Appointment booking") ||
    message.startsWith("Only scheduled") ||
    message.startsWith("Cannot change") ||
    message.startsWith("The amount charged") ||
    message.startsWith("That local time") ||
    message.startsWith("Provide a valid") ||
    message.startsWith("This professional");
  const status = forbidden ? 403 : notFound ? 404 : conflict ? 409 : invalid ? 400 : 500;
  if (status === 500) {
    logger.error(`appointment.${operation}_failed`, { tenantId, userId, message });
  }
  return NextResponse.json(
    { error: status === 500 ? "Appointment could not be saved." : message },
    { status },
  );
}

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import {
  createAppointment,
  updateAppointment,
} from "@/features/appointments/appointment.service";
import type { SessionUser } from "@/lib/auth/session";

const user: SessionUser = {
  uid: "appointment-test-owner",
  email: "appointment@example.test",
  displayName: "Appointment Owner",
  emailVerified: true,
};

let tenantId = "";

describe("appointment schedule guard", () => {
  beforeAll(async () => {
    tenantId = adminDb.collection("tenants").doc().id;
    const tenant = adminDb.doc(`tenants/${tenantId}`);
    const refs = [
      tenant,
      tenant.collection("members").doc(user.uid),
      tenant.collection("settings").doc("general"),
      tenant.collection("customers").doc("customer-test"),
      tenant.collection("services").doc("service-test"),
      tenant.collection("professionals").doc("professional-test"),
    ];
    const batch = adminDb.batch();
    batch.set(refs[0], { name: "Test studio" });
    batch.set(refs[1], { role: "owner", status: "active" });
    batch.set(refs[2], {
      timeZone: "UTC",
      operatingHours: Object.fromEntries(
        ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(
          (day) => [day, { open: "00:00", close: "23:59", closed: false }],
        ),
      ),
    });
    batch.set(refs[3], { name: "Test customer" });
    batch.set(refs[4], {
      name: "Test service",
      durationMinutes: 60,
      priceMinorUnits: 5000,
      status: "active",
    });
    batch.set(refs[5], {
      name: "Test professional",
      serviceIds: ["service-test"],
      status: "active",
    });
    await batch.commit();
  });

  beforeEach(async () => {
    const [appointments, guards] = await Promise.all([
      adminDb.collection(`tenants/${tenantId}/appointments`).get(),
      adminDb.collection(`tenants/${tenantId}/scheduleGuards`).get(),
    ]);
    const batch = adminDb.batch();
    [...appointments.docs, ...guards.docs].forEach((document) => batch.delete(document.ref));
    await batch.commit();
  });

  afterAll(async () => {
    if (tenantId) {
      await adminDb.recursiveDelete(adminDb.doc(`tenants/${tenantId}`));
    }
    await adminDb.terminate();
  });

  function booking(localStart: string) {
    return createAppointment(user, tenantId, {
      customerId: "customer-test",
      serviceIds: ["service-test"],
      professionalId: "professional-test",
      localStart,
    });
  }

  it("allows only one of two concurrent overlapping bookings", async () => {
    const outcomes = await Promise.allSettled([
      booking("2026-01-05T09:00"),
      booking("2026-01-05T09:30"),
    ]);

    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(1);
    const saved = await adminDb
      .collection(`tenants/${tenantId}/appointments`)
      .get();
    expect(saved.size).toBe(1);
  });

  it("allows adjacent non-overlapping bookings", async () => {
    const outcomes = await Promise.allSettled([
      booking("2026-01-05T09:00"),
      booking("2026-01-05T10:00"),
    ]);

    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(2);
  });

  it("frees the reserved interval after cancellation", async () => {
    const first = await booking("2026-01-05T09:00");
    await updateAppointment(user, tenantId, {
      action: "status",
      appointmentId: first.id,
      status: "Cancelled",
    });
    await expect(booking("2026-01-05T09:00")).resolves.toMatchObject({ id: expect.any(String) });
  });

  it("keeps the original service snapshot when the catalog changes later", async () => {
    const appointment = await booking("2026-01-05T09:00");
    await adminDb.doc(`tenants/${tenantId}/services/service-test`).update({
      name: "Updated service",
      priceMinorUnits: 9000,
    });
    const saved = await adminDb.doc(`tenants/${tenantId}/appointments/${appointment.id}`).get();
    expect(saved.get("serviceSnapshot")).toMatchObject({
      name: "Test service",
      durationMinutes: 60,
      priceMinorUnits: 5000,
    });
  });
});

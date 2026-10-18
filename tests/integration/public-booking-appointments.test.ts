import { createHash } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { createPublicAppointment } from "@/features/public-booking/public-appointment.service";

const identity = { email: "client@example.test" };
const clientId = "public-booking-client-record";
const spoofedClientId = "some-other-client";
const options = {
  email: identity.email,
  professionalId: "professional-public",
  serviceIds: ["service-consultation", "service-follow-up"],
  localStart: "2026-10-19T09:00",
};

let tenantId = "";
let secondTenantId = "";

function emailKey(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function weekdayHours() {
  return Object.fromEntries(
    ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(
      (day) => [day, { open: "09:00", close: "12:00", closed: false }],
    ),
  );
}

async function clearAppointments(id: string) {
  const [appointments, guards] = await Promise.all([
    adminDb.collection(`tenants/${id}/appointments`).get(),
    adminDb.collection(`tenants/${id}/scheduleGuards`).get(),
  ]);
  const batch = adminDb.batch();
  [...appointments.docs, ...guards.docs].forEach((document) => batch.delete(document.ref));
  await batch.commit();
}

async function savedAppointments(id: string) {
  return adminDb.collection(`tenants/${id}/appointments`).get();
}

describe("public booking appointment creation", () => {
  beforeAll(async () => {
    tenantId = adminDb.collection("tenants").doc().id;
    secondTenantId = adminDb.collection("tenants").doc().id;
    const batch = adminDb.batch();

    for (const id of [tenantId, secondTenantId]) {
      const tenant = adminDb.doc(`tenants/${id}`);
      batch.set(tenant, { name: "Public booking studio", timeZone: "Europe/London" });
      batch.set(tenant.collection("settings").doc("general"), {
        timeZone: "Europe/London",
        operatingHours: weekdayHours(),
      });
      batch.set(tenant.collection("customers").doc(clientId), {
        name: "Verified Client",
        email: identity.email,
        isArchived: false,
      });
      batch.set(tenant.collection("customers").doc(spoofedClientId), {
        name: "Different Client",
        email: "different@example.test",
        isArchived: false,
      });
      batch.set(tenant.collection("services").doc("service-consultation"), {
        name: "Consultation",
        durationMinutes: 30,
        priceMinorUnits: 5000,
        status: "active",
      });
      batch.set(tenant.collection("services").doc("service-follow-up"), {
        name: "Follow-up",
        durationMinutes: 30,
        priceMinorUnits: 2500,
        status: "active",
      });
      batch.set(tenant.collection("professionals").doc(options.professionalId), {
        name: "Alex",
        serviceIds: options.serviceIds,
        status: "active",
      });
    }

    batch.set(
      adminDb.doc(`tenants/${tenantId}/customerEmailIndex/${emailKey(identity.email)}`),
      { status: "active", customerId: clientId },
    );
    // The second tenant intentionally has no matching index entry. Its same-ID customer
    // record must not make the first tenant's verified identity resolve across tenants.
    await batch.commit();
  });

  beforeEach(async () => {
    await Promise.all([clearAppointments(tenantId), clearAppointments(secondTenantId)]);
  });

  afterAll(async () => {
    if (tenantId) await adminDb.recursiveDelete(adminDb.doc(`tenants/${tenantId}`));
    if (secondTenantId) await adminDb.recursiveDelete(adminDb.doc(`tenants/${secondTenantId}`));
    await adminDb.terminate();
  });

  it("creates one verified client's appointment with authoritative per-service snapshots", async () => {
    const result = await createPublicAppointment(tenantId, options);

    expect(result).toMatchObject({ appointment: { id: expect.any(String) } });
    const saved = await adminDb.doc(`tenants/${tenantId}/appointments/${result.appointment.id}`).get();
    expect(saved.data()).toMatchObject({
      customerId: clientId,
      professionalId: options.professionalId,
      serviceIds: options.serviceIds,
      status: "Scheduled",
      createdBy: "public-booking",
      timeZoneAtBooking: "Europe/London",
      serviceSnapshot: {
        services: [
          { name: "Consultation", durationMinutes: 30, priceMinorUnits: 5000 },
          { name: "Follow-up", durationMinutes: 30, priceMinorUnits: 2500 },
        ],
        durationMinutes: 60,
        priceMinorUnits: 7500,
      },
    });
    expect(saved.get("startAtUtc")).toBeInstanceOf(Timestamp);
    expect(saved.get("endAtUtc")).toBeInstanceOf(Timestamp);
  });

  it("does not resolve a client identity or create an appointment across tenants", async () => {
    await expect(
      createPublicAppointment(secondTenantId, options),
    ).rejects.toMatchObject({ status: 404 });

    expect((await savedAppointments(secondTenantId)).size).toBe(0);
  });

  it("rejects a spoofed customer ID instead of accepting caller identity", async () => {
    await expect(
      createPublicAppointment(tenantId, {
        ...options,
        customerId: spoofedClientId,
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect((await savedAppointments(tenantId)).size).toBe(0);
  });

  it("allows only one of two concurrent overlapping public submissions", async () => {
    const outcomes = await Promise.allSettled([
      createPublicAppointment(tenantId, options),
      createPublicAppointment(tenantId, {
        ...options,
        localStart: "2026-10-19T09:30",
      }),
    ]);

    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(1);
    expect((await savedAppointments(tenantId)).size).toBe(1);
  });

  it("allows adjacent public appointment intervals", async () => {
    const outcomes = await Promise.allSettled([
      createPublicAppointment(tenantId, options),
      createPublicAppointment(tenantId, {
        ...options,
        localStart: "2026-10-19T10:00",
      }),
    ]);

    expect(outcomes.every((outcome) => outcome.status === "fulfilled")).toBe(true);
    expect((await savedAppointments(tenantId)).size).toBe(2);
  });

  it("returns a conflict and creates no duplicate when the selected slot has gone stale", async () => {
    await createPublicAppointment(tenantId, options);

    await expect(createPublicAppointment(tenantId, options)).rejects.toMatchObject({
      status: 409,
    });
    expect((await savedAppointments(tenantId)).size).toBe(1);
  });
});

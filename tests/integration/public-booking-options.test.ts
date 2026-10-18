import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getPublicBookingOptions } from "@/features/public-booking/public-catalog.service";
import { calculateAvailability } from "@/features/public-booking/availability.service";

const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

let tenantId = "";
let otherTenantId = "";

describe("public booking options and availability", () => {
  beforeAll(async () => {
    tenantId = adminDb.collection("tenants").doc().id;
    otherTenantId = adminDb.collection("tenants").doc().id;
    const tenant = adminDb.doc(`tenants/${tenantId}`);
    const settings = adminDb.doc(`tenants/${tenantId}/settings/general`);
    const batch = adminDb.batch();

    batch.set(tenant, {
      name: "Public Studio",
      internalNotes: "must not be public",
      ownerUid: "private-owner",
    });
    batch.set(settings, {
      timeZone: "UTC",
      operatingHours: Object.fromEntries(
        weekdays.map((day) => [day, { open: "09:00", close: "12:00", closed: false }]),
      ),
      billingPlan: "internal-plan",
      reminderSettings: { enabled: true },
    });
    batch.set(adminDb.doc(`tenants/${tenantId}/services/service-active`), {
      name: "Consultation",
      durationMinutes: 60,
      priceMinorUnits: 5000,
      status: "active",
      internalCostMinorUnits: 1200,
      description: "Private staff description",
    });
    batch.set(adminDb.doc(`tenants/${tenantId}/services/service-inactive`), {
      name: "Archived service",
      durationMinutes: 30,
      priceMinorUnits: 1000,
      status: "inactive",
    });
    batch.set(adminDb.doc(`tenants/${tenantId}/professionals/professional-active`), {
      name: "Alex",
      serviceIds: ["service-active"],
      status: "active",
      email: "alex@private.example",
      role: "staff",
    });
    batch.set(adminDb.doc(`tenants/${tenantId}/professionals/professional-inactive`), {
      name: "Former professional",
      serviceIds: ["service-active"],
      status: "inactive",
    });
    batch.set(adminDb.doc(`tenants/${tenantId}/customers/private-customer`), {
      name: "Private customer",
      email: "customer@private.example",
    });

    // A second workspace uses the same record IDs with different public values. A route scoped
    // to the first workspace must never return or use the second workspace's records.
    batch.set(adminDb.doc(`tenants/${otherTenantId}`), { name: "Other Studio" });
    batch.set(adminDb.doc(`tenants/${otherTenantId}/settings/general`), {
      timeZone: "UTC",
      operatingHours: Object.fromEntries(
        weekdays.map((day) => [day, { open: "09:00", close: "12:00", closed: false }]),
      ),
    });
    batch.set(adminDb.doc(`tenants/${otherTenantId}/services/service-active`), {
      name: "Other tenant service",
      durationMinutes: 15,
      priceMinorUnits: 1,
      status: "active",
    });
    batch.set(adminDb.doc(`tenants/${otherTenantId}/professionals/professional-active`), {
      name: "Other tenant professional",
      serviceIds: ["service-active"],
      status: "active",
    });
    await batch.commit();
  });

  beforeEach(async () => {
    const appointments = await adminDb.collection(`tenants/${tenantId}/appointments`).get();
    const batch = adminDb.batch();
    appointments.docs.forEach((appointment) => batch.delete(appointment.ref));
    await batch.commit();
  });

  afterAll(async () => {
    if (tenantId) await adminDb.recursiveDelete(adminDb.doc(`tenants/${tenantId}`));
    if (otherTenantId) await adminDb.recursiveDelete(adminDb.doc(`tenants/${otherTenantId}`));
    await adminDb.terminate();
  });

  it("returns only allow-listed workspace, active service, and active professional fields", async () => {
    const options = await getPublicBookingOptions(tenantId);

    expect(options).toEqual({
      workspace: { name: "Public Studio", timeZone: "UTC" },
      services: [
        {
          id: "service-active",
          name: "Consultation",
          durationMinutes: 60,
          priceMinorUnits: 5000,
        },
      ],
      professionals: [
        { id: "professional-active", name: "Alex", serviceIds: ["service-active"] },
      ],
    });
  });

  it("keeps booking-option and availability reads tenant-isolated", async () => {
    const options = await getPublicBookingOptions(tenantId);
    expect(options.workspace.name).not.toBe("Other Studio");
    expect(options.services.map((service) => service.name)).not.toContain("Other tenant service");
    expect(options.professionals.map((professional) => professional.name)).not.toContain(
      "Other tenant professional",
    );

    const availability = await calculateAvailability(tenantId, {
      professionalId: "professional-active",
      serviceIds: ["service-active"],
      date: "2026-01-05",
    });
    expect(availability).toMatchObject({
      date: "2026-01-05",
      timeZone: "UTC",
      durationMinutes: 60,
      priceMinorUnits: 5000,
    });
  });

  it("excludes occupied intervals and rejects a professional ineligible for the selected service", async () => {
    await adminDb.doc(`tenants/${tenantId}/appointments/occupied`).set({
      professionalId: "professional-active",
      startAtUtc: Timestamp.fromDate(new Date("2026-01-05T09:30:00.000Z")),
      endAtUtc: Timestamp.fromDate(new Date("2026-01-05T10:30:00.000Z")),
      status: "Scheduled",
    });

    const availability = await calculateAvailability(tenantId, {
      professionalId: "professional-active",
      serviceIds: ["service-active"],
      date: "2026-01-05",
    });
    expect(availability.availableTimes).toEqual(["10:30", "10:45", "11:00"]);

    await expect(
      calculateAvailability(tenantId, {
        professionalId: "professional-active",
        serviceIds: ["service-inactive"],
        date: "2026-01-05",
      }),
    ).rejects.toThrow();
  });
});

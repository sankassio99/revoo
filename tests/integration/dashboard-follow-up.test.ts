import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getDashboardOverview } from "@/features/dashboard/dashboard.service";
import type { SessionUser } from "@/lib/auth/session";

const user: SessionUser = {
  uid: "dashboard-test-owner",
  email: "dashboard@example.test",
  displayName: "Dashboard Owner",
  emailVerified: true,
};
const now = new Date("2025-06-15T12:00:00.000Z");
let tenantId = "";

describe("workspace dashboard and follow-up eligibility", () => {
  beforeAll(async () => {
    tenantId = adminDb.collection("tenants").doc().id;
    const tenant = adminDb.doc(`tenants/${tenantId}`);
    const batch = adminDb.batch();
    batch.set(tenant, { name: "Dashboard studio", currency: "EUR", timeZone: "UTC" });
    batch.set(tenant.collection("members").doc(user.uid), { role: "owner", status: "active" });
    batch.set(tenant.collection("settings").doc("general"), {
      timeZone: "UTC",
      reactivationIntervalDays: 30,
    });
    batch.set(tenant.collection("customers").doc("customer-follow-up"), {
      name: "Eligible customer",
      phone: "+15551234567",
      email: null,
      isArchived: false,
      lastVisitAt: Timestamp.fromDate(new Date("2025-05-01T10:00:00.000Z")),
      communicationPreferences: { whatsappMarketing: "granted" },
    });
    batch.set(tenant.collection("customers").doc("customer-no-consent"), {
      name: "No marketing permission",
      phone: "+15551234568",
      isArchived: false,
      lastVisitAt: Timestamp.fromDate(new Date("2025-05-01T10:00:00.000Z")),
      communicationPreferences: { whatsappMarketing: "denied" },
    });
    batch.set(tenant.collection("customers").doc("customer-recent"), {
      name: "Recent visitor",
      phone: "+15551234569",
      isArchived: false,
      lastVisitAt: Timestamp.fromDate(new Date("2025-06-01T10:00:00.000Z")),
      communicationPreferences: { whatsappMarketing: "granted" },
    });

    const appointments = tenant.collection("appointments");
    batch.set(appointments.doc("completed-with-charge"), {
      customerId: "customer-follow-up",
      professionalId: "professional-1",
      startAtUtc: Timestamp.fromDate(new Date("2025-06-15T09:00:00.000Z")),
      endAtUtc: Timestamp.fromDate(new Date("2025-06-15T10:00:00.000Z")),
      status: "Completed",
      amountChargedMinorUnits: 3200,
      serviceSnapshot: { priceMinorUnits: 5000 },
    });
    batch.set(appointments.doc("completed-default-charge"), {
      customerId: "customer-follow-up",
      professionalId: "professional-1",
      startAtUtc: Timestamp.fromDate(new Date("2025-06-15T10:00:00.000Z")),
      endAtUtc: Timestamp.fromDate(new Date("2025-06-15T11:00:00.000Z")),
      status: "Completed",
      amountChargedMinorUnits: null,
      serviceSnapshot: { priceMinorUnits: 2200 },
    });
    batch.set(appointments.doc("scheduled"), {
      customerId: "customer-recent",
      professionalId: "professional-1",
      startAtUtc: Timestamp.fromDate(new Date("2025-06-15T11:00:00.000Z")),
      endAtUtc: Timestamp.fromDate(new Date("2025-06-15T12:00:00.000Z")),
      status: "Scheduled",
      serviceSnapshot: { priceMinorUnits: 8000 },
    });
    batch.set(appointments.doc("cancelled"), {
      customerId: "customer-no-consent",
      professionalId: "professional-1",
      startAtUtc: Timestamp.fromDate(new Date("2025-06-15T12:00:00.000Z")),
      endAtUtc: Timestamp.fromDate(new Date("2025-06-15T13:00:00.000Z")),
      status: "Cancelled",
      serviceSnapshot: { priceMinorUnits: 9000 },
    });
    await batch.commit();
  });

  afterAll(async () => {
    if (tenantId) await adminDb.recursiveDelete(adminDb.doc(`tenants/${tenantId}`));
    await adminDb.terminate();
  });

  it("counts each status and calculates revenue from completed appointments only", async () => {
    const overview = await getDashboardOverview(user, tenantId, "UTC", now);

    expect(overview.totalAppointments).toBe(4);
    expect(overview.statusCounts).toEqual({
      Scheduled: 1,
      Confirmed: 0,
      Completed: 2,
      Cancelled: 1,
      NoShow: 0,
    });
    expect(overview.revenueMinorUnits).toBe(5400);
  });

  it("returns only past-visit customers with current marketing permission", async () => {
    const overview = await getDashboardOverview(user, tenantId, "UTC", now);

    expect(overview.followUps.map((customer) => customer.id)).toContain("customer-follow-up");
    expect(overview.followUps.map((customer) => customer.id)).not.toContain("customer-no-consent");
    expect(overview.followUps.map((customer) => customer.id)).not.toContain("customer-recent");
  });
});

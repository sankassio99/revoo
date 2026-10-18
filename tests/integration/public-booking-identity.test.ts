import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import {
  publicClientRegistrationSchema,
} from "@/features/public-booking/public-booking.schema";
import {
  registerPublicClient,
  resolvePublicClient,
} from "@/features/public-booking/public-client.service";
import { backfillCustomerEmailIndex } from "../../scripts/backfill-customer-email-index";

const identity = { email: "client@example.test" };
const staff = { uid: "public-booking-identity-staff" };

const tenantIds: string[] = [];
let tenantId = "";

function expectStatus(error: unknown, status: number) {
  expect(error).toMatchObject({ status });
}

async function expectStatusRejected(action: () => unknown, status: number) {
  try {
    await action();
    throw new Error(`Expected operation to reject with status ${status}.`);
  } catch (error) {
    expectStatus(error, status);
  }
}

describe("public booking client identity", () => {
  beforeEach(async () => {
    tenantId = adminDb.collection("tenants").doc().id;
    tenantIds.push(tenantId);
    const batch = adminDb.batch();
    batch.set(adminDb.doc(`tenants/${tenantId}`), { name: "Identity test workspace", timeZone: "UTC" });
    batch.set(adminDb.doc(`tenants/${tenantId}/members/${staff.uid}`), {
      role: "owner",
      status: "active",
    });
    await batch.commit();
  });

  afterAll(async () => {
    await Promise.all(tenantIds.map((id) => adminDb.recursiveDelete(adminDb.doc(`tenants/${id}`))));
    await adminDb.terminate();
  });

  it("returns the registration path when no client profile matches the provided email", async () => {
    await expect(resolvePublicClient(tenantId, identity)).resolves.toMatchObject({ registrationRequired: true });
  });

  it("registers a new client and resolves that client on subsequent email lookup", async () => {
    const registered = await registerPublicClient(tenantId, identity, {
      email: identity.email,
      name: "  Casey Client  ",
      phone: " +44 7700 900123 ",
    });

    expect(registered).toMatchObject({
      registrationRequired: false,
      client: { id: expect.any(String), name: "Casey Client" },
    });
    const customer = await adminDb.doc(`tenants/${tenantId}/customers/${registered.client.id}`).get();
    expect(customer.data()).toMatchObject({
      email: "client@example.test",
      communicationPreferences: {
        whatsappService: "unknown",
        whatsappMarketing: "unknown",
        emailMarketing: "unknown",
      },
    });
    await expect(resolvePublicClient(tenantId, identity)).resolves.toMatchObject({
      registrationRequired: false,
      client: { id: registered.client.id, name: "Casey Client" },
    });
  });

  it("resolves an existing active customer and does not expose an archived match", async () => {
    const registered = await registerPublicClient(tenantId, identity, {
      email: identity.email,
      name: "Existing Client",
      phone: "5551234567",
    });
    expect(await resolvePublicClient(tenantId, identity)).toMatchObject({
      registrationRequired: false,
      client: { id: registered.client.id },
    });

    await adminDb.doc(`tenants/${tenantId}/customers/${registered.client.id}`).update({
      isArchived: true,
      archivedAt: new Date(),
    });
    await expect(resolvePublicClient(tenantId, identity)).resolves.toMatchObject({
      registrationRequired: true,
    });
  });

  it("returns a safe conflict for duplicate normalized customer emails", async () => {
    await Promise.all([
      adminDb.doc(`tenants/${tenantId}/customers/duplicate-one`).set({
        name: "First",
        email: "client@example.test",
        isArchived: false,
      }),
      adminDb.doc(`tenants/${tenantId}/customers/duplicate-two`).set({
        name: "Second",
        email: " Client@Example.Test ",
        isArchived: false,
      }),
    ]);
    await backfillCustomerEmailIndex(adminDb);

    await expect(resolvePublicClient(tenantId, identity)).rejects.toMatchObject({ status: 409 });
  });

  it("rejects unexpected fields in public registration", async () => {
    expect(publicClientRegistrationSchema.safeParse({
      email: identity.email,
      name: "Spoofed Client",
      phone: "5551234567",
      uid: "victim-uid",
      tenantId: "another-workspace",
    }).success).toBe(false);

    await expectStatusRejected(() => registerPublicClient(tenantId, identity, {
      email: identity.email,
      name: "Actual Client",
      phone: "5551234567",
      uid: "victim-uid",
    }), 400);
  });

  it("never resolves a customer's email from a different workspace", async () => {
    const otherTenantId = adminDb.collection("tenants").doc().id;
    tenantIds.push(otherTenantId);
    await adminDb.doc(`tenants/${otherTenantId}`).set({ name: "Other workspace", timeZone: "UTC" });
    const registered = await registerPublicClient(otherTenantId, identity, {
      email: identity.email,
      name: "Other Workspace Client",
      phone: "5551234567",
    });

    await expect(resolvePublicClient(tenantId, identity)).resolves.toMatchObject({
      registrationRequired: true,
    });
    await expect(resolvePublicClient(otherTenantId, identity)).resolves.toMatchObject({
      client: { id: registered.client.id },
      registrationRequired: false,
    });
  });
});

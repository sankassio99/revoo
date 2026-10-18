import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import {
  archiveCustomer,
  createCustomer,
  updateCustomer,
} from "@/features/customers/customer.service";
import { backfillCustomerEmailIndex } from "../../scripts/backfill-customer-email-index";
import type { SessionUser } from "@/lib/auth/session";

const staff: SessionUser = {
  uid: "customer-email-index-staff",
  email: "staff@example.test",
  displayName: "Staff",
  emailVerified: true,
};

const tenantIds: string[] = [];
let tenantId = "";

describe("customer email index maintenance", () => {
  beforeEach(async () => {
    tenantId = adminDb.collection("tenants").doc().id;
    tenantIds.push(tenantId);
    const batch = adminDb.batch();
    batch.set(adminDb.doc(`tenants/${tenantId}`), { name: "Index test workspace" });
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

  async function customerIndexRows() {
    const snapshot = await adminDb.collection(`tenants/${tenantId}/customerEmailIndex`).get();
    return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
  }

  it("creates an index entry, replaces it on email change, and removes it on archive", async () => {
    const created = await createCustomer(staff, tenantId, {
      name: "Jordan Reed",
      phone: "+1 555 222 3333",
      email: "  Jordan@Example.test ",
    });

    let rows = await customerIndexRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ customerId: created.id });
    expect(JSON.stringify(rows[0])).not.toContain("jordan@example.test");

    await updateCustomer(staff, tenantId, created.id, { email: "next@example.test" });
    rows = await customerIndexRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ customerId: created.id });
    expect(JSON.stringify(rows[0])).not.toContain("next@example.test");

    await expect(archiveCustomer(staff, tenantId, created.id)).resolves.toBe(true);
    expect(await customerIndexRows()).toHaveLength(0);
  });

  it("does not create an email index entry for customers without email", async () => {
    await createCustomer(staff, tenantId, {
      name: "No Email",
      phone: "555 222 3333",
    });

    expect(await customerIndexRows()).toHaveLength(0);
  });

  it("reports duplicate normalized emails and leaves an ambiguous index without choosing a customer", async () => {
    const customers = adminDb.collection(`tenants/${tenantId}/customers`);
    const first = customers.doc("duplicate-one");
    const second = customers.doc("duplicate-two");
    await Promise.all([
      first.set({ name: "First", email: "same@example.test", isArchived: false }),
      second.set({ name: "Second", email: " Same@Example.Test ", isArchived: false }),
    ]);

    const result = await backfillCustomerEmailIndex(adminDb);
    const duplicate = result.duplicates.find((item) => item.tenantId === tenantId);
    expect(duplicate).toMatchObject({
      tenantId,
      customerIds: expect.arrayContaining(["duplicate-one", "duplicate-two"]),
    });
    expect(duplicate?.customerIds).toHaveLength(2);

    const index = await adminDb.doc(`tenants/${tenantId}/customerEmailIndex/${duplicate?.emailKey}`).get();
    expect(index.data()).toMatchObject({ status: "ambiguous" });
    expect(index.get("customerId")).toBeUndefined();
    expect(JSON.stringify(index.data())).not.toContain("same@example.test");
  });
});

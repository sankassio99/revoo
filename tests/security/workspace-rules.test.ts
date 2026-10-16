import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  cleanupFirebaseTestEnvironment,
  getFirebaseTestEnvironment,
} from "../setup/firebase";

const tenantId = "tenant-12345678901234567890";

describe("workspace Firestore rules", () => {
  beforeAll(async () => {
    await getFirebaseTestEnvironment();
  });

  beforeEach(async () => {
    const environment = await getFirebaseTestEnvironment();
    await environment.clearFirestore();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `tenants/${tenantId}`), {
        name: "Studio",
      });
      await setDoc(
        doc(context.firestore(), `tenants/${tenantId}/members/owner-uid`),
        { role: "owner", status: "active" },
      );
      await setDoc(
        doc(context.firestore(), `tenants/${tenantId}/members/staff-uid`),
        { role: "staff", status: "active" },
      );
      await setDoc(
        doc(context.firestore(), `tenants/${tenantId}/members/revoked-uid`),
        { role: "staff", status: "revoked" },
      );
      await setDoc(doc(context.firestore(), `tenants/${tenantId}/services/service-1`), {
        name: "Cut",
      });
    });
  });

  afterAll(cleanupFirebaseTestEnvironment);

  it("denies unauthenticated reads and writes", async () => {
    const environment = await getFirebaseTestEnvironment();
    const customerRef = doc(
      environment.unauthenticatedContext().firestore(),
      `tenants/${tenantId}/customers/customer-1`,
    );

    await assertFails(getDoc(customerRef));
    await assertFails(setDoc(customerRef, { name: "A customer" }));
  });

  it("denies direct access to non-members and revoked members", async () => {
    const environment = await getFirebaseTestEnvironment();
    for (const uid of ["stranger-uid", "revoked-uid"]) {
      const customerRef = doc(
        environment.authenticatedContext(uid).firestore(),
        `tenants/${tenantId}/customers/customer-1`,
      );
      await assertFails(getDoc(customerRef));
      await assertFails(setDoc(customerRef, { name: "A customer" }));
    }
  });

  it("allows active members to access workspace customers", async () => {
    const environment = await getFirebaseTestEnvironment();
    const customerRef = doc(
      environment.authenticatedContext("staff-uid").firestore(),
      `tenants/${tenantId}/customers/customer-1`,
    );

    await assertSucceeds(setDoc(customerRef, { name: "A customer" }));
    await assertSucceeds(getDoc(customerRef));
  });

  it("allows staff to read services but not change owner-only catalog records", async () => {
    const environment = await getFirebaseTestEnvironment();
    const staffDb = environment.authenticatedContext("staff-uid").firestore();
    const serviceRef = doc(staffDb, `tenants/${tenantId}/services/service-1`);

    await assertSucceeds(getDoc(serviceRef));
    await assertFails(setDoc(serviceRef, { name: "Changed" }));
  });

  it("allows owners to update workspace profile", async () => {
    const environment = await getFirebaseTestEnvironment();
    const ownerDb = environment.authenticatedContext("owner-uid").firestore();

    await assertSucceeds(
      setDoc(doc(ownerDb, `tenants/${tenantId}`), { name: "Updated studio" }),
    );
  });
});

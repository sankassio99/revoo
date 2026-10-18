import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key";

async function createWorkspace(page: Page) {
  const ownerEmail = `public-booking-owner-${randomUUID()}@example.test`;
  const password = `Revoo-${randomUUID()}!`;
  const authUrl = `http://${authEmulatorHost}/identitytoolkit.googleapis.com/v1`;
  const signUpResponse = await page.request.post(`${authUrl}/accounts:signUp?key=${apiKey}`, {
    data: { email: ownerEmail, password, returnSecureToken: true },
  });
  expect(signUpResponse.ok()).toBeTruthy();
  const signUp = await signUpResponse.json() as { idToken: string };
  const verifyResponse = await page.request.post(`${authUrl}/accounts:update?key=${apiKey}`, {
    data: { idToken: signUp.idToken, emailVerified: true, returnSecureToken: true },
  });
  expect(verifyResponse.ok()).toBeTruthy();
  const verified = await verifyResponse.json() as { idToken: string };
  expect((await page.request.post("/api/session", { data: { idToken: verified.idToken } })).ok()).toBeTruthy();

  const workspaceResponse = await page.request.post("/api/workspaces", {
    data: { name: "Public Booking Test Studio", currency: "GBP", timeZone: "UTC" },
  });
  expect(workspaceResponse.ok()).toBeTruthy();
  const { tenantId } = await workspaceResponse.json() as { tenantId: string };
  const settings = await page.request.put(`/api/workspaces/${tenantId}/settings`, {
    data: {
      name: "Public Booking Test Studio",
      currency: "GBP",
      timeZone: "UTC",
      contact: { email: "", phone: "", address: "" },
      operatingHours: Object.fromEntries(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => [day, { closed: false, open: "09:00", close: "17:00" }])),
      reminderSettings: { enabled: false, intervalsMinutes: [] },
      reactivationIntervalDays: 90,
    },
  });
  expect(settings.ok()).toBeTruthy();
  const serviceResponse = await page.request.post(`/api/workspaces/${tenantId}/catalog`, {
    data: { kind: "service", value: { name: "Consultation", durationMinutes: 30, priceMinorUnits: 5000 } },
  });
  expect(serviceResponse.ok()).toBeTruthy();
  const { id: serviceId } = await serviceResponse.json() as { id: string };
  const professionalResponse = await page.request.post(`/api/workspaces/${tenantId}/catalog`, {
    data: { kind: "professional", value: { name: "Alex", serviceIds: [serviceId] } },
  });
  expect(professionalResponse.ok()).toBeTruthy();
  const { id: professionalId } = await professionalResponse.json() as { id: string };
  return { tenantId, ownerEmail, serviceId, professionalId };
}

async function chooseBooking(page: Page, tenantId: string) {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await page.goto(`/book/${tenantId}`);
  await page.getByLabel("Professional").selectOption({ label: "Alex" });
  await page.getByLabel("Consultation").check();
  await page.getByLabel("Date").fill(tomorrow);
  const time = page.getByRole("button", { name: "09:00", exact: true });
  await expect(time).toBeVisible({ timeout: 15_000 });
  await time.click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  try {
    await page.request.get(`http://${authEmulatorHost}`);
    await page.request.get(`http://${firestoreEmulatorHost}`);
  } catch {
    test.skip(true, "Start the Firebase Auth and Firestore emulators before public booking browser tests.");
  }
});

test("books an existing client found by email and shows matching confirmation details", async ({ page }) => {
  const fixture = await createWorkspace(page);
  const customerResponse = await page.request.post(`/api/workspaces/${fixture.tenantId}/customers`, {
    data: { name: "Owner Client", phone: "5551234567", email: fixture.ownerEmail },
  });
  expect(customerResponse.ok()).toBeTruthy();

  await chooseBooking(page, fixture.tenantId);
  await page.getByLabel("Email address").fill(fixture.ownerEmail);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByText(/Welcome back, Owner Client/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Continue to confirmation" }).click();
  await page.getByRole("button", { name: "Confirm appointment" }).click();
  await expect(page.getByRole("heading", { name: "Your appointment is booked" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Consultation")).toBeVisible();
  await expect(page.getByText("Alex")).toBeVisible();
});

test("registers a new client after an email lookup and keeps the booking choices", async ({ page }) => {
  const fixture = await createWorkspace(page);
  await page.request.delete("/api/session");
  await chooseBooking(page, fixture.tenantId);
  await page.getByLabel("Email address").fill(`new-client-${randomUUID()}@example.test`);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByText(/We couldn’t find a client profile/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Consultation/)).toBeVisible();
  await page.getByLabel("Name").fill("New Client");
  await page.getByLabel("Phone").fill("+44 7700 900123");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByRole("button", { name: "Continue to confirmation" }).click();
  await page.getByRole("button", { name: "Confirm appointment" }).click();
  await expect(page.getByRole("heading", { name: "Your appointment is booked" })).toBeVisible({ timeout: 15_000 });
});

test("returns to time selection when the chosen slot becomes stale", async ({ page }) => {
  const fixture = await createWorkspace(page);
  await page.request.post(`/api/workspaces/${fixture.tenantId}/customers`, {
    data: { name: "Owner Client", phone: "5551234567", email: fixture.ownerEmail },
  });
  await chooseBooking(page, fixture.tenantId);
  await page.getByRole("button", { name: "Continue to confirmation" }).click();
  await page.route(`**/api/public/workspaces/${fixture.tenantId}/appointments`, async (route) => {
    await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: "That time is no longer available." }) });
  });
  await page.getByRole("button", { name: "Confirm appointment" }).click();
  await expect(page.getByText(/That time was just taken/)).toBeVisible();
  await expect(page.getByText(/Choose another available time/)).toBeVisible();
  await expect(page.getByLabel("Professional")).toHaveValue(fixture.professionalId);
});

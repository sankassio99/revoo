import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const authEmulatorHost =
  process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
const firestoreEmulatorHost =
  process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key";

test.beforeEach(async ({ page }) => {
  try {
    await page.request.get(`http://${authEmulatorHost}`);
    await page.request.get(`http://${firestoreEmulatorHost}`);
  } catch {
    test.skip(
      true,
      "Start the Firebase Auth and Firestore emulators before running workspace navigation browser tests.",
    );
  }

  const email = `navigation-${randomUUID()}@example.test`;
  const password = `Revoo-${randomUUID()}!`;
  const authUrl = `http://${authEmulatorHost}/identitytoolkit.googleapis.com/v1`;
  const signUpResponse = await page.request.post(
    `${authUrl}/accounts:signUp?key=${apiKey}`,
    {
      data: { email, password, returnSecureToken: true },
    },
  );
  expect(signUpResponse.ok()).toBeTruthy();
  const signUp = (await signUpResponse.json()) as { idToken: string };

  const verifyResponse = await page.request.post(
    `${authUrl}/accounts:update?key=${apiKey}`,
    {
      data: {
        idToken: signUp.idToken,
        emailVerified: true,
        returnSecureToken: true,
      },
    },
  );
  expect(verifyResponse.ok()).toBeTruthy();
  const verified = (await verifyResponse.json()) as { idToken: string };

  const sessionResponse = await page.request.post("/api/session", {
    data: { idToken: verified.idToken },
  });
  expect(sessionResponse.ok()).toBeTruthy();

  const workspaceResponse = await page.request.post("/api/workspaces", {
    data: { name: "Navigation Test Studio", currency: "EUR", timeZone: "UTC" },
  });
  expect(workspaceResponse.status()).toBe(201);
});

test("navigates to every primary workspace destination", async ({ page }) => {
  const destinations = [
    { label: "Overview", href: "/workspace" },
    { label: "Appointments", href: "/workspace/appointments" },
    { label: "Customers", href: "/workspace/customers" },
    { label: "Follow-up", href: "/workspace/follow-up" },
    { label: "Reports", href: "/workspace/reports" },
  ];

  await page.goto("/workspace");

  for (const destination of destinations) {
    const link = page.getByRole("link", { name: destination.label, exact: true });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${destination.href.replaceAll("/", "\\/")}$`));
    await expect(link).toHaveAttribute("aria-current", "page");
  }
});

test("opens Settings destinations from the expandable group", async ({ page }) => {
  await page.goto("/workspace/settings");

  const settingsToggle = page.getByRole("button", { name: "Settings", exact: true });
  await expect(settingsToggle).toHaveAttribute("aria-expanded", "true");

  for (const destination of [
    { label: "Business", href: "/workspace/settings" },
    { label: "Catalog", href: "/workspace/settings/catalog" },
    { label: "Team", href: "/workspace/settings/team" },
  ]) {
    const link = page.getByRole("link", { name: destination.label, exact: true });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${destination.href.replaceAll("/", "\\/")}$`));
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(settingsToggle).toHaveAttribute("aria-expanded", "true");
  }
});

test("uses the shared navigation on mobile and closes it after navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/workspace");

  const toggle = page.getByRole("button", { name: "Toggle workspace navigation" });
  await toggle.click();

  const settingsToggle = page.getByRole("button", { name: "Settings", exact: true });
  await settingsToggle.focus();
  await page.keyboard.press("Space");
  await expect(settingsToggle).toHaveAttribute("aria-expanded", "true");

  const catalogLink = page.getByRole("link", { name: "Catalog", exact: true });
  await catalogLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/workspace\/settings\/catalog$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

# Quickstart: Public Appointment Booking

This guide validates the feature after implementation. Run commands from the repository root.

## Prerequisites

- Node.js 22-24 and installed package dependencies.
- Firebase Emulator Suite configured for the `demo-revoo-crm` project.
- Firebase email-link authentication enabled for the local emulator and the authorized booking return URL configured.
- A workspace seeded with workspace settings, an active professional, active assigned service(s), and available hours.

## Validate domain and integration behavior

1. Run focused domain and component tests:

   ```powershell
   npx vitest run tests/domain/public-booking.test.ts
   ```

   Expected: service compatibility, email normalization, duration/slot filtering, and local-time boundaries pass.

2. Run public booking integration tests through the Auth and Firestore emulators:

   ```powershell
   npx firebase emulators:exec --project demo-revoo-crm --only auth,firestore "npx vitest run tests/integration/public-booking.test.ts"
   ```

   Expected: public allow-listed data, verified identity requirements, registration, tenant isolation, service changes, workspace hours, per-service booking snapshots, and transaction conflicts are covered; competing bookings cannot create overlapping appointments.

## Validate the browser journey

1. Start the local application and configured emulators in separate terminals:

   ```powershell
   npm run emulators
   ```

   ```powershell
   npm run dev
   ```

2. Run the public booking browser test:

   ```powershell
   npx playwright test tests/e2e/public-booking.spec.ts
   ```

   Expected: a client can select a professional, services, and time; verify their email; register if needed; submit; and view matching confirmation details. A stale slot returns the client to time selection without creating an appointment.

3. Manually open `/book/{tenantId}` for a seeded workspace and verify that public responses contain no customer records, staff-only workspace settings, member data, or schedule-guard metadata.

## Additional checks

```powershell
npm run typecheck
npm run lint
```

Before release, test the email link on the production host/domain and confirm its return URL cannot be redirected to an untrusted origin.

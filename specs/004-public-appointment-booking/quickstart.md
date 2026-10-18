# Quickstart: Public Appointment Booking

This guide validates the feature after implementation. Run commands from the repository root.

## Prerequisites

- Node.js 22-24 and installed package dependencies.
- Firebase Emulator Suite configured for the `demo-revoo-crm` project.
- A workspace seeded with workspace settings, an active professional, active assigned service(s), and available hours.

### Exercise email lookup

Choose an email from an existing customer record to verify the existing-client path. Use a new email to verify the registration path; the page should ask for a name and phone without sending a code or requiring sign-in. The check is scoped to the workspace in the booking URL. Email matching does not prove that the visitor controls the address.

## Validate domain and integration behavior

1. Run focused domain and component tests:

   ```powershell
   npx vitest run tests/domain/public-booking-availability.test.ts tests/domain/public-booking-identity.test.ts tests/domain/public-booking-appointments.test.ts
   ```

   Expected: service compatibility, email normalization, duration/slot filtering, and local-time boundaries pass.

2. Run public booking integration tests through the Auth and Firestore emulators:

   ```powershell
   npx firebase emulators:exec --project demo-revoo-crm --only auth,firestore "npx vitest run tests/integration/public-booking-options.test.ts tests/integration/public-booking-identity.test.ts tests/integration/customer-email-index.test.ts tests/integration/public-booking-appointments.test.ts"
   ```

   Expected: public allow-listed data, email lookup, registration, tenant isolation, service changes, workspace hours, per-service booking snapshots, and transaction conflicts are covered; competing bookings cannot create overlapping appointments.

Before enabling public booking in a workspace, run the one-time email-index backfill with the target Firebase project and credentials configured in the environment:

```powershell
node --experimental-strip-types scripts/backfill-customer-email-index.ts
```

Review the reported duplicate email keys and resolve each workspace's duplicate customer records before enabling public booking. The report contains hashed email keys and customer IDs, not email addresses.

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

The public flow checks the provided email directly against the workspace's customer index and does not send an email code. Email matching does not establish ownership of the address.

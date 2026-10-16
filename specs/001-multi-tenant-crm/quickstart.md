# Quickstart: CRM Validation

This guide defines the end-to-end validation path for the planned implementation. The repository
currently contains requirements and planning artifacts only; the commands below become runnable
when the application, Compose configuration, and test scripts are implemented.

## Prerequisites

- Docker Desktop with Docker Compose.
- Node.js 22 LTS for local tooling and scripts.
- Firebase CLI (`firebase-tools`) available through the project scripts or local development
  dependencies.
- A local `.env` file containing non-production Firebase web configuration and emulator host
  settings. Never put production service credentials in the development environment.
- A Firebase demo project ID (for example, `demo-revoo-crm`) used consistently by the application,
  emulator, and tests.

## Start the Local Environment

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Expected outcome: the web application and required Firebase Authentication and Firestore
emulators start; the application connects only to those emulators. The emulator UI is available
at the configured local port (Firebase default: `4000`).

## Validate Core Workflows

Run the project scripts that will be provided during implementation:

```powershell
npm run test:unit
npm run test:rules
npm run test:integration
npm run test:e2e
```

Expected outcomes:

- Rules tests deny unauthenticated access, cross-workspace reads/writes, and staff attempts to
  manage owner-only services, professionals, settings, and invitations.
- Workspace onboarding creates the workspace and owner membership as one successful operation;
  failed onboarding exposes no partially configured workspace.
- Appointment tests race overlapping bookings for one professional and verify at most one
  conflicting booking commits; non-overlapping intervals remain bookable.
- Customer, service, professional, appointment, dashboard, and settings records remain scoped to
  the active workspace.
- Consent tests suppress marketing messages without marketing permission and do not send the
  same campaign occurrence twice.
- Messaging failure tests show appointment operations remain available and that failure status
  is observable.

## Verify Performance and Recovery

Run the representative performance and restore exercises documented by the implementation:

```powershell
npm run test:performance
npm run test:recovery
```

Expected outcomes:

- At least 95% of representative customer search, calendar, and dashboard queries complete
  within the 300 ms p95 target.
- The configured backup can be restored in an isolated test environment and the recovered
  records continue to satisfy workspace isolation.
- Until product owners specify stricter service objectives, validate against the provisional
  daily backup / 24-hour recovery point / 8-hour restore assumptions in [research.md](./research.md).

## Stop the Environment

```powershell
docker compose down
```

Persisted emulator data is retained or removed according to the documented project cleanup
command; cleanup must not affect production data.

For the planned entity boundaries and validations, see [data-model.md](./data-model.md).
For the provider behavior contract, see [contracts/messaging-boundary.md](./contracts/messaging-boundary.md).

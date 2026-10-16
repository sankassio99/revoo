# Quickstart: CRM Validation

This guide describes the current local development and validation workflow. Never put production
Firebase configuration or service-account credentials in the local environment.

## Prerequisites

- Docker Desktop with Docker Compose.
- Node.js 22 LTS for local tooling and scripts.
- Java and Firebase CLI for running emulator-backed test scripts directly on the host.
- Playwright browser binaries for E2E tests.
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

Expected outcome: the web application and Firebase Authentication and Firestore emulators start;
the application connects only to those emulators. The emulator UI is available at port `4000`.
The Compose emulator service includes its own runtime; host-side `test:rules` and
`test:integration` scripts use Firebase CLI's emulator runner and therefore require Java on the
host.

## Validate Core Workflows

Run the implemented test scripts:

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

The current repository has unit tests and a subset of emulator-backed integration and Rules
tests. Playwright journeys, messaging-provider integration tests, representative performance
measurements, and a recovery exercise are not yet implemented; do not treat successful commands
as evidence for those acceptance criteria.

The `test:performance` and `test:recovery` scripts are not currently backed by complete fixtures
and recovery tooling.

## Stop the Environment

```powershell
docker compose down
```

Emulator data is stored in the named local Docker volume and must not be connected to production.

For the planned entity boundaries and validations, see [data-model.md](./data-model.md).
For the provider behavior contract, see [contracts/messaging-boundary.md](./contracts/messaging-boundary.md).

# Implementation Plan: Multi-Tenant CRM for Service Businesses

**Branch**: `master` (current) | **Feature**: `001-multi-tenant-crm` | **Date**: 2026-10-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-multi-tenant-crm/spec.md`

## Summary

Deliver a multi-tenant CRM for barbershops and beauty clinics. Owners configure a workspace
and staff, manage services and professionals, and share customer and appointment workflows.
The design prioritizes verified tenant and role authorization, conflict-free scheduling,
privacy-conscious follow-up, and isolation of optional messaging failures from core CRM work.
The product requirements select Next.js App Router, TypeScript, Tailwind CSS, Firebase
Authentication, Cloud Firestore, and a Docker Compose development environment with Firebase
Emulator Suite. Cloud Functions and automated WhatsApp delivery are conditional integrations.

## Technical Context

**Language/Version**: TypeScript; Node.js 22 LTS for the Admin SDK, scripts, and containers.

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, Firebase client SDK,
Firebase Admin SDK, Cloud Firestore, Firebase Emulator Suite, `@firebase/rules-unit-testing`,
Vitest, and Playwright. Cloud Functions are used for privileged bootstrap/invitation operations
and asynchronous scheduled messaging when that feature is enabled. Automated messaging is
optional and uses the WhatsApp Business Platform.

**Storage**: Cloud Firestore, with tenant-owned operational data under tenant-scoped records,
Firebase Authentication for identity, and managed Firestore backups for recovery.

**Testing**: Vitest for isolated synchronous domain logic and client components; Playwright for
end-to-end and async Server Component flows; `@firebase/rules-unit-testing` and Firebase
Emulator Suite for authorization and multi-tenant isolation; integration tests for booking
concurrency, messaging, and recovery.

**Target Platform**: Web application served by Next.js; local development and tests run using
Docker Compose and Firebase Emulator Suite; production Firestore is a managed service.

**Project Type**: Single web application.

**Performance Goals**: p95 under 300 ms for common customer searches, calendar views, and
dashboard views under documented representative test conditions.

**Constraints**: Firestore Security Rules deny by default and verify membership and role.
Privileged server operations must authorize independently because the Admin SDK bypasses Rules.
Tenant isolation must cover direct data requests. All appointment mutations for a professional
must use a shared transaction guard so concurrent interval checks cannot commit overlapping
bookings. Messaging failures must not block CRM operations. Separate development and production
credentials. Provisional recovery assumption: daily backup, 24-hour recovery point, and restore
within 8 hours until product owners define service objectives.

**Scale/Scope**: Multiple businesses served by one application; per-tenant scale and workload
limits are not specified. MVP includes onboarding, owner/staff permissions, customer, service,
professional and appointment management, dashboard, follow-up, configurable business settings,
and optional messaging. Customer self-service booking, payment processing, and push notifications
are out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / gate | Plan alignment | Status |
|------------------|----------------|--------|
| Tenant isolation and least privilege | Workspace-owned records, deny-by-default Firestore Rules, server-side authorization for privileged operations, and cross-tenant tests are design requirements. | PASS |
| Privacy and communication consent | Minimize personal data; enforce latest communication preferences before delivery; suppress unauthorized and duplicate marketing. | PASS |
| Reliable business invariants | Preserve booking-time service details and change history; prevent professional schedule conflicts under concurrent requests. | PASS |
| Verifiable quality and operations | Unit/integration/rules tests, representative p95 measurement, observable failures, emulator environment, and restore exercise are planned. | PASS |
| Resilient, focused architecture | Use the required Next.js/TypeScript/Firebase stack; keep WhatsApp optional and isolated from core appointment workflows. | PASS |
| Security and release quality gates | No release with known cross-tenant access failures or untested recovery; review authorization and privacy impact. | PASS |

No constitution violations are currently identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-tenant-crm/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── messaging-boundary.md
└── tasks.md
```

### Source Code (repository root)

The repository currently contains requirements and Spec Kit artifacts, but no application
source tree or package manifests. The following is a proposed single-application layout to
validate during implementation; it is not a claim about existing files.

```text
src/
├── app/                 # App Router layouts, pages, route handlers, boundaries
├── features/
│   ├── workspaces/      # Membership, invitations, settings
│   ├── customers/
│   ├── services/
│   ├── professionals/
│   ├── appointments/
│   ├── dashboard/
│   └── messaging/
├── components/          # Shared user interface
└── lib/                 # Firebase clients, Admin SDK, auth, validation, utilities
tests/
├── unit/                # Vitest domain logic and synchronous client components
├── integration/         # Emulator-backed workflows, transactions, and failure paths
├── security/            # Firestore Security Rules and cross-tenant authorization
└── e2e/                 # Playwright user journeys and role-aware access
firebase/                # Emulator and Security Rules configuration
```

**Structure Decision**: Use one Next.js web application with feature-oriented modules and a
shared server/client Firebase boundary. Security Rules cover client SDK access, and privileged
Admin SDK operations use shared server-side authorization helpers. Keep rules and emulator
configuration at repository root or under `firebase/` according to Firebase CLI conventions.
Playwright covers asynchronous Server Components because Next.js unit test tooling does not
currently support their full behavior.

### Post-Design Constitution Gate

**Result: PASS.** Phase 1 preserves all six checks above. The data model scopes every operational
entity to a workspace; the messaging contract requires current consent and isolates failures;
the schedule-guard design prevents concurrent conflicting writes; and the quickstart includes
rules, integration, performance, and recovery validation. No unresolved `NEEDS CLARIFICATION`
items or unjustified constitution violations remain. The daily-backup/24-hour recovery point/
8-hour restore target and per-workspace WhatsApp account assumption are explicitly provisional
in [research.md](./research.md) and require confirmation before production.

## Complexity Tracking

No constitution violations requiring a complexity exception.

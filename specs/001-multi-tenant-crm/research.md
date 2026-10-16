# Research: Multi-Tenant CRM for Service Businesses

**Date**: 2026-10-16

This repository has no application source, dependency manifest, or test configuration yet.
Decisions below are therefore grounded in `requirements.md`, the feature spec, and the official
platform documentation cited inline. They are design decisions for implementation, not claims
about existing code.

## 1. Application and runtime

**Decision**: Build a single Next.js App Router application in TypeScript, with routes and route
boundaries under `src/app/` and private domain code organized by feature. Use React Server
Components by default; isolate interactive forms and controls in small Client Components.
Keep `.env*` files at the repository root. Use a supported Node.js 22 LTS runtime for the
server-side Firebase Admin SDK and the selected Next.js release.

**Rationale**: The source requirements explicitly select Next.js App Router and TypeScript.
Next.js documents the `src/` directory, route groups, and private folders as supported
organization conventions. Server Components keep server-only operations out of browser bundles.
Firebase's Admin SDK is for privileged server environments and requires a supported Node runtime.

**Alternatives considered**: A separate frontend/backend monorepo was rejected for the MVP
because Next.js route handlers/server actions and conditional Cloud Functions cover the stated
server needs without introducing another application boundary. The Pages Router was not chosen
because the requirements explicitly select App Router.

**Sources**:
- https://nextjs.org/docs/app/getting-started/project-structure
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://nextjs.org/docs/app/guides/environment-variables
- https://firebase.google.com/docs/admin/setup

## 2. Firebase identity, membership, and authorization

**Decision**: Keep each workspace's membership authoritative in a workspace-scoped membership
record. Enforce membership and role checks in deny-by-default Firestore Security Rules for
client SDK data access. Keep privileged Admin SDK modules server-only and require explicit
verified-caller authorization in every privileged operation; Admin SDK reads and writes do not
pass through Firestore Security Rules. Do not encode all workspace memberships in custom claims:
users may belong to multiple workspaces, claims have a 1000-byte limit, and token claims can
remain stale until refreshed.

**Rationale**: Firestore Rules support role-based checks using document lookups, while the
Admin SDK bypasses those Rules. Firebase documents both the Admin SDK's privileged role and
server-side ID-token verification. A membership document is the canonical record for multi-tenant
membership and can be checked for current role status on each protected path.

**Alternatives considered**: Storing every workspace role in custom claims avoids Rules document
lookups but creates a size limit and stale-role/revocation problems. A small active-workspace
claim may be considered as an optimization later, but it must not replace the authoritative
membership check.

**Implementation guardrails**:
- Keep Rule lookups within Firestore's document-access-call limits (10 for a single document or
  query evaluation; 20 for multi-document reads, transactions, or batched writes).
- Account for the fact that Rules do not cascade to subcollections; explicitly cover each data
  collection.
- Invitation acceptance and membership revocation must validate authenticated identity and
  current workspace owner authority. Pending invitations are application records, not a built-in
  Firebase invite primitive.
- Do not rely on role-aware UI visibility as authorization.

**Sources**:
- https://firebase.google.com/docs/firestore/solutions/role-based-access
- https://firebase.google.com/docs/firestore/security/rules-structure
- https://firebase.google.com/docs/firestore/security/rules-conditions#access_other_documents
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://firebase.google.com/docs/auth/admin/custom-claims
- https://firebase.google.com/docs/auth/admin/manage-sessions

## 3. Workspace bootstrap and invitations

**Decision**: Create the workspace and its creator's Owner membership atomically in a
server-side Firestore transaction. Model staff invitations as tenant-scoped pending records
with explicit pending, accepted, expired, and revoked states. Acceptance must verify the
authenticated invitee and apply membership changes atomically. Keep email delivery outside
transaction callbacks.

**Rationale**: Firestore transactions apply all writes or none, but callbacks may retry, so
external side effects inside a transaction risk duplicate effects. Firebase Authentication
provides user and token primitives but not an application-specific workspace invitation
lifecycle.

**Alternatives considered**: Client-only bootstrap was rejected because workspace creation is a
privileged, multi-record operation and must not expose partial setup. Custom token sign-in is
not required by the stated invite workflow.

**Source**:
- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/auth/admin/manage-users

## 4. Appointment integrity and concurrency

**Decision**: Calculate a complete appointment interval in the workspace's time zone and reject
any overlap with a non-cancelled appointment for the same professional. Perform conflict check
and appointment write in a Firestore transaction that reads and updates one shared guard record
per professional. Every appointment create, reschedule, or cancellation for that professional
must update this same record. If two transactions both find an empty interval, only one can
commit against the same guard version; the other retries and rechecks the now-current appointment
query. Exclude cancelled records from conflicts; retain completed and no-show appointments as
historical records.

**Rationale**: Firestore tracks transaction conflicts on documents read, not on a query's
nonexistent result range. Two query-only transactions can both observe no conflicting appointment
and insert a phantom overlap. A shared guard creates the document-level conflict needed to force
one transaction to retry. A per-professional guard is simple and works with arbitrary durations
and start times without inventing a slot granularity. It serializes all schedule mutations for
that professional; measure contention under representative load before deciding whether to adopt
a more granular lock scheme.

**Alternatives considered**: Client-side preflight queries and transaction queries without a
shared guard were rejected because concurrent requests can both observe an empty interval.
Deterministic slot-claim documents can reduce contention but require a minimum booking increment,
duration bounds, and safe handling for variable-length appointments. They are a future
optimization only if measurements justify the added constraints.

**Validation requirement**: Emulator-backed integration tests must race overlapping and
non-overlapping create/reschedule operations and assert that no conflicting appointments commit.
Transactions must read before writing and must not make external calls from retryable callbacks.

**Source**:
- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/firestore/transaction-data-contention
- https://firebase.google.com/docs/firestore/quotas#writes_and_transactions

## 5. Testing strategy

**Decision**: Use `@firebase/rules-unit-testing` against the Firestore Emulator Suite for
Security Rules and cross-tenant authorization. Use Playwright end-to-end tests for complete
onboarding, role permissions, appointment flows, and asynchronous Server Component behavior.
Use Vitest for isolated synchronous domain logic and client components; do not rely on unit
rendering alone for async Server Components.

**Rationale**: The repository has no testing-library precedent. Firebase recommends automated
Rules tests against emulators. Next.js documents Vitest/Jest for unit tests and Playwright or
Cypress for E2E, and notes the current async Server Component limitation in unit test tooling.
Vitest is a reasonable TypeScript-first default for pure logic; choosing a test runner is
revisitable before scaffolding if maintainers have an established preference.

**Alternatives considered**: Jest is also supported by Next.js and remains a valid option. The
current repository provides no basis to prefer it. Manual emulator checks are insufficient as
the only cross-tenant regression test.

**Sources**:
- https://firebase.google.com/docs/rules/unit-tests
- https://firebase.google.com/docs/app-hosting/local-development
- https://nextjs.org/docs/app/guides/testing
- https://nextjs.org/docs/app/guides/testing/vitest
- https://nextjs.org/docs/app/guides/testing/playwright

## 6. Local development and emulator safety

**Decision**: Use Docker Compose services for the web application and a Node.js/JDK-based
Firebase Emulator Suite container. Initially enable only Authentication and Firestore
emulators; add Functions only when Functions are part of the implementation. Use a `demo-*`
Firebase project ID consistently in app configuration and test setup. Mount Rules and emulator
configuration into the emulator service, persist emulator data when useful, and keep production
credentials out of development configuration.

**Rationale**: The project requirements call for a reproducible Docker Compose environment.
Firebase documents the CLI-driven Emulator Suite, its service ports, demo project safety, and
automated Rules testing. The Firebase documentation does not provide a Firebase-maintained
emulator Docker image; a custom image is therefore needed if the emulator itself is containerized.

**Alternatives considered**: Running the emulators on the host is simpler, but does not meet the
requested Compose-reproducible environment. Running an unused Functions emulator adds startup
cost without value.

**Sources**:
- https://firebase.google.com/docs/emulator-suite
- https://firebase.google.com/docs/emulator-suite/install_and_configure
- https://firebase.google.com/docs/emulator-suite/connect_firestore
- https://firebase.google.com/docs/rules/unit-tests

## 7. WhatsApp, consent, and failure isolation

**Decision**: Treat automated WhatsApp as optional and separately configured for each workspace.
Model at least general WhatsApp communication permission and marketing permission separately;
record the consent state and enough evidence to trace when and how it was obtained, plus
opt-out/revocation. Recheck current preference immediately before sending. Treat appointment
confirmations/reminders as utility communications and reactivation campaigns as marketing, using
provider-approved templates as required by the applicable messaging window and policy.

Queue messages independently of appointment writes. Keep a tenant-scoped send-attempt record
with a stable occurrence key (workspace, customer, message purpose/campaign, and applicable
period) so retries cannot send duplicates. Process provider status notifications idempotently
using the provider message ID and status. Expose queued, sent, delivered/read when supplied,
failed, and suppressed outcomes. Retry transient rate limits with bounded backoff; do not retry
permanent policy or consent failures.

**Rationale**: Meta requires opt-in before messaging and recommends distinct opt-in categories;
reactivation is marketing, while appointment updates are utility. Provider status webhooks may
arrive asynchronously or more than once, so event processing and pre-send checks must be
idempotent. Sending synchronously would couple CRM writes to an unreliable external service.

**Assumptions for this MVP**: Each workspace connects a business-owned WhatsApp Business account
or phone number; the platform does not pool a single outbound identity across unrelated
businesses. This is a conservative isolation assumption, not an explicit source requirement.
Consent capture UX and legal retention of consent evidence must be reviewed for the actual
jurisdictions before production.

**Alternatives considered**: One shared provider account may reduce onboarding, but can mix
business identities and share recipient throughput limits across tenants. Synchronous delivery
was rejected because it conflicts with the explicit requirement that messaging failures not
block appointment management.

**Sources**:
- https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in
- https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/utility-templates/utility-templates
- https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates
- https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages
- https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages
- https://developers.facebook.com/documentation/business-messaging/whatsapp/support/error-codes
- https://developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits
- https://firebase.google.com/docs/functions/schedule-functions

## 8. Operational assumptions and decisions to confirm

- **Backup/recovery target**: Until product owners set service objectives, plan for at least daily
  backups (maximum 24-hour recovery point) and a documented restore exercise completing within
  8 hours. These are provisional MVP planning targets, not stated requirements; confirm before
  production.
- **Representative performance**: No tenant/user/data-volume baseline is supplied. Define and
  document a representative fixture before measuring the required p95 under 300 ms target; do
  not claim a scale limit from the current requirements.
- **Consent jurisdiction**: Before production, confirm supported markets and have the exact
  consent language, evidence retention, and retention/deletion periods reviewed for applicable
  law. The design stores separate message-purpose preferences and can capture evidence, but does
  not claim legal compliance by itself.
- **Messaging-provider onboarding**: Automated delivery remains disabled until a workspace has
  connected and verified a supported WhatsApp Business account and configured approved message
  templates.

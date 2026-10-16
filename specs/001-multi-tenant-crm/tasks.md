# Tasks: Multi-Tenant CRM for Service Businesses

**Input**: Design documents from `specs/001-multi-tenant-crm/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/messaging-boundary.md`, `quickstart.md`

**Tests**: Included because the feature specification requires measurable security, concurrency, performance, and recovery outcomes.

**Organization**: Tasks are grouped by user story. Complete the Setup and Foundational phases before story work; then deliver each story as an independently validated increment, respecting the story dependencies below.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable against other marked tasks in the same phase because files and prerequisites do not overlap.
- **[Story]**: User-story mapping: `[US1]` workspace onboarding, `[US2]` customer and appointment management, `[US3]` dashboard and retention, `[US4]` business operations.
- Every task names concrete repository paths to create or update.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the application and local development foundation described in `plan.md`.

- [ ] T001 Initialize the Node.js 22 LTS Next.js App Router TypeScript application and project scripts in `package.json`, `tsconfig.json`, `next.config.ts`, and `src/app/layout.tsx`.
- [ ] T002 [P] Configure Tailwind CSS and shared global styles in `postcss.config.mjs`, `tailwind.config.ts`, and `src/app/globals.css`.
- [ ] T003 [P] Add a multi-stage Node.js Docker build and Compose services for the web app and Firebase emulators in `Dockerfile`, `docker-compose.yml`, and `.dockerignore`.
- [ ] T004 [P] Configure demo-project Firebase Authentication and Firestore emulators, Security Rules loading, and emulator UI in `firebase.json`, `.firebaserc`, and `firestore.rules`.
- [ ] T005 [P] Document local-only environment keys and add safe placeholders in `.env.example`; ensure `.gitignore` excludes `.env` and service-account credentials.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared data, identity, authorization, validation, testing, and observability boundaries required by every story.

- [ ] T006 Create server-only Firebase Admin and browser Firebase client initializers in `src/lib/firebase/admin.ts` and `src/lib/firebase/client.ts`; ensure Admin credentials and imports cannot enter client bundles.
- [ ] T007 Implement deny-by-default Firestore Security Rules for workspace memberships and each operational subcollection in `firestore.rules`; cover every collection explicitly because Rules do not cascade into subcollections.
- [ ] T008 Implement verified session resolution and shared `requireWorkspaceMember` / `requireWorkspaceOwner` authorization helpers in `src/lib/auth/session.ts` and `src/lib/auth/authorization.ts`; Admin SDK calls must authorize independently of Security Rules.
- [ ] T009 [P] Add structured, privacy-safe server error logging and operation identifiers in `src/lib/observability/logger.ts`; never log access tokens or unnecessary customer message content.
- [ ] T010 [P] Configure Vitest, Playwright, Firebase Emulator Suite test commands, and `@firebase/rules-unit-testing` setup in `vitest.config.ts`, `playwright.config.ts`, `tests/setup/firebase.ts`, and `package.json`.
- [ ] T011 [P] Add shared schemas and validators for opaque IDs, server timestamps, integer currency minor units, and valid IANA time-zone identifiers in `src/lib/validation/common.ts` and `src/lib/domain/money.ts`.

**Checkpoint**: Firebase client/server boundaries, authorization primitives, test harness, local emulators, and shared validation are ready.

## Phase 3: User Story 1 - Set Up a Secure Business Workspace (Priority: P1)

**Goal**: Let owners register, create a fully owned workspace, invite staff, and switch workspaces without exposing data across tenant boundaries.

**Independent Test**: Create two workspaces and memberships; verify owner bootstrap is atomic, staff acceptance works, staff cannot access owner-only operations, unauthenticated/private access is denied, and direct cross-workspace reads and writes fail.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add Firestore Rules tests for unauthenticated access, non-member direct reads/writes, active member access, revoked membership, and staff denial of owner-only workspace actions in `tests/security/workspace-rules.test.ts`.
- [ ] T013 [P] [US1] Add emulator-backed workspace bootstrap and invitation integration tests, including failed bootstrap atomicity, expired/revoked invite rejection, and invitee identity matching, in `tests/integration/workspace-onboarding.test.ts`.
- [ ] T014 [P] [US1] Add Playwright journeys for registration, sign-in, password recovery, staff invitation acceptance, and switching between two workspaces in `tests/e2e/workspace-onboarding.spec.ts`.

### Implementation for User Story 1

- [ ] T015 [US1] Define User, Workspace, Membership, and Invitation schemas in `src/features/workspaces/workspace.schema.ts`; use unique opaque `tenantId`, membership role `owner` or `staff`, membership status `active` or `revoked`, and invitation status `pending`, `accepted`, `expired`, or `revoked`.
- [ ] T016 [US1] Implement registration, sign-in, sign-out, password recovery, and private-route redirects in `src/app/(auth)/register/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/recover/page.tsx`, and `src/app/(dashboard)/layout.tsx`.
- [ ] T017 [US1] Implement atomic server-side workspace and creator-owner membership creation in `src/features/workspaces/workspace.service.ts` and `src/app/api/workspaces/route.ts`; do not report success unless both records commit.
- [ ] T018 [US1] Implement owner-only staff invitation creation, identity-verified acceptance, expiration, revocation, and membership revocation in `src/features/workspaces/invitation.service.ts` and `src/app/api/workspaces/[tenantId]/invitations/route.ts`; keep email delivery outside retryable transaction callbacks.
- [ ] T019 [US1] Implement authorized workspace listing and active-workspace switching in `src/features/workspaces/workspace-switcher.tsx` and `src/app/(dashboard)/workspaces/page.tsx`; each switch must reload data under the selected authorized `tenantId`.
- [ ] T020 [US1] Implement initial workspace profile creation and protected owner settings bootstrap in `src/features/workspaces/workspace-settings.schema.ts` and `src/features/workspaces/workspace.service.ts`; require business name, supported currency code, valid IANA time zone, and workspace-scoped operating-hour settings.

**Checkpoint**: Validate User Story 1 independently with `tests/security/workspace-rules.test.ts`, `tests/integration/workspace-onboarding.test.ts`, and `tests/e2e/workspace-onboarding.spec.ts`.

## Phase 4: User Story 2 - Manage Customers, Services, Professionals, and Appointments (Priority: P1)

**Goal**: Allow authorized members to manage customer records and appointments while owners manage services and professionals; preserve booking history and prevent conflicting schedules.

**Independent Test**: In one authorized workspace, create customer, service, and professional records; book, reschedule, cancel, complete, and review appointments; verify permission boundaries, booking-time snapshots, correct local calendar display, and race-safe overlap rejection.

### Tests for User Story 2

- [ ] T021 [P] [US2] Add emulator-backed customer tests for required name and phone, optional email, archive behavior, workspace-scoped name/phone search, advisory duplicate detection, and appointment history in `tests/integration/customers.test.ts`.
- [ ] T022 [P] [US2] Add service and professional tests for owner-only CRUD, non-negative integer minor-unit prices, positive service duration, same-workspace service references, active/inactive states, and immutable booking snapshots in `tests/integration/catalog.test.ts`.
- [ ] T023 [P] [US2] Add appointment transaction race tests for overlapping and non-overlapping create/reschedule operations, guard updates on cancellation, and full interval/time-zone/operating-hours validation in `tests/integration/appointment-concurrency.test.ts`.
- [ ] T024 [P] [US2] Add Playwright coverage for customer management, service/professional setup, calendar views, appointment state changes, and staff denial of catalog editing in `tests/e2e/appointment-management.spec.ts`.

### Implementation for User Story 2

- [ ] T025 [US2] Define Customer schema in `src/features/customers/customer.schema.ts`; require `name` and `phone`, allow optional `email`, scope communication preferences to the workspace, and set `archivedAt` only when archived.
- [ ] T026 [US2] Implement owner/staff customer create, view, edit, archive, phone/name search, advisory duplicate detection, and appointment-history retrieval in `src/features/customers/customer.service.ts` and `src/app/(dashboard)/customers/page.tsx`.
- [ ] T027 [US2] Define Service and Professional schemas in `src/features/catalog/catalog.schema.ts`; service `durationMinutes` must be positive, `priceMinorUnits` a non-negative integer, status `active` or `inactive`, and every `serviceId` reference must belong to the same workspace.
- [ ] T028 [US2] Implement owner-only service and professional create/edit/deactivate operations in `src/features/catalog/catalog.service.ts` and `src/app/(dashboard)/settings/catalog/page.tsx`; inactive professionals and services cannot be selected for new appointments.
- [ ] T029 [US2] Define Appointment schema and allowed transitions in `src/features/appointments/appointment.schema.ts`; permit only `Scheduled`, `Confirmed`, `Completed`, `Cancelled`, and `NoShow`, require `endAtUtc > startAtUtc`, and snapshot service name, duration, and price at booking.
- [ ] T030 [US2] Implement full-interval overlap checking, local-time interpretation, service eligibility, business-hours validation, booking-time snapshots, amount charged, and append-only change history in `src/features/appointments/appointment.service.ts`.
- [ ] T031 [US2] Implement shared per-professional schedule-guard transactions for create, reschedule, and cancel operations in `src/features/appointments/schedule-guard.ts`; every mutation must read/update the same guard and recheck overlaps after transaction retries.
- [ ] T032 [US2] Implement authorized appointment create/update/status actions in `src/app/api/workspaces/[tenantId]/appointments/route.ts`; preserve service snapshots and reject invalid state transitions or cross-workspace references.
- [ ] T033 [US2] Implement daily and weekly workspace-local appointment calendars in `src/app/(dashboard)/appointments/page.tsx` and `src/features/appointments/appointment-calendar.tsx`; exclude cancelled appointments from reserved intervals while retaining them in history.

**Checkpoint**: Validate User Story 2 independently with the customer/catalog integration suites, appointment race tests, and `tests/e2e/appointment-management.spec.ts`.

## Phase 5: User Story 3 - Monitor Business Activity and Retain Customers (Priority: P2)

**Goal**: Show workspace-scoped business activity and follow-up candidates, and support consent-aware, deduplicated messaging that does not block appointment work.

**Independent Test**: Seed two workspaces with different appointments, revenue, consent preferences, campaigns, and provider outcomes; verify dashboard scoping, marketing suppression, send deduplication, observable provider failures, and CRM availability during messaging outage.

### Tests for User Story 3

- [ ] T034 [P] [US3] Add dashboard and follow-up integration tests for daily appointments, counts by each status, completed-only revenue, configured return interval, and tenant isolation in `tests/integration/dashboard-follow-up.test.ts`.
- [ ] T035 [P] [US3] Add message eligibility and idempotency tests proving current consent is rechecked at send time, marketing requires explicit marketing permission, duplicate occurrence keys do not send twice, and duplicate provider status callbacks are idempotent in `tests/integration/messaging.test.ts`.
- [ ] T036 [P] [US3] Add outage and retry tests showing appointment mutations succeed while messaging fails, transient rate-limit failures are bounded/retried, and permanent consent/policy failures are suppressed in `tests/integration/messaging-failures.test.ts`.
- [ ] T037 [P] [US3] Add Playwright journeys for workspace dashboard, follow-up list, manual WhatsApp link, and visible message outcomes in `tests/e2e/dashboard-messaging.spec.ts`.

### Implementation for User Story 3

- [ ] T038 [US3] Implement workspace-scoped daily appointment/status counts, completed-appointment revenue, and follow-up queries in `src/features/dashboard/dashboard.service.ts`; calculate all totals only from the authorized active workspace.
- [ ] T039 [US3] Implement dashboard cards, appointment navigation, and customer-profile links in `src/app/(dashboard)/page.tsx` and `src/features/dashboard/dashboard-cards.tsx`.
- [ ] T040 [US3] Extend Customer communication-preference validation in `src/features/customers/customer.schema.ts` to store separate purpose/channel permission state and consent evidence fields `state`, `purpose`, `channel`, `capturedAt`, and `source/method`.
- [ ] T041 [US3] Implement follow-up eligibility using each workspace's configured reactivation interval and latest customer visit in `src/features/messaging/follow-up.service.ts`; exclude customers without current marketing permission and expose profile/manual-contact actions in `src/app/(dashboard)/follow-up/page.tsx`.
- [ ] T042 [US3] Implement workspace-scoped Message Campaign and Message Record schemas in `src/features/messaging/message.schema.ts`; campaign status must be `draft`, `active`, `paused`, or `completed`, and message status must be `queued`, `sent`, `delivered`, `read`, `failed`, or `suppressed`.
- [ ] T043 [US3] Implement transactional deduplication claims and asynchronous WhatsApp send dispatch in `src/features/messaging/message.service.ts` and `src/functions/send-message.ts`; derive unique occurrence keys from workspace, recipient, purpose/campaign, and period, and recheck consent immediately before dispatch.
- [ ] T044 [US3] Implement provider callback authentication, workspace resolution from trusted sender configuration, idempotent provider-message-ID/status processing, and classified failure recording in `src/app/api/webhooks/whatsapp/route.ts`.
- [ ] T045 [US3] Implement manual prefilled WhatsApp conversations, confirmation/reminder generation, and authorized message outcome visibility in `src/features/messaging/whatsapp-link.ts` and `src/features/messaging/message-status.tsx`; do not expose provider credentials or block appointment requests.
- [ ] T046 [US3] Add the provider-independent send, webhook, consent, deduplication, and retry contract adapter in `src/features/messaging/provider.ts`; use test fixtures/stubs locally and never production credentials.

**Checkpoint**: Validate User Story 3 independently with dashboard, consent, idempotency, outage, and E2E tests. Automated sending remains disabled unless an approved workspace sender and templates are configured.

## Phase 6: User Story 4 - Configure Business Operations (Priority: P2)

**Goal**: Let owners update workspace contact details, currency, time zone, operating hours, and communication intervals, with changes isolated to their workspace.

**Independent Test**: Update settings in one of two workspaces; verify only the owner can make changes and subsequent calendar, appointment validation, dashboard display, and follow-up calculations use the selected workspace settings.

### Tests for User Story 4

- [ ] T047 [P] [US4] Add workspace settings Rules and integration tests for owner-only updates, staff denial, valid currency/time-zone/hours values, and no cross-workspace leakage in `tests/integration/workspace-settings.test.ts`.
- [ ] T048 [P] [US4] Add Playwright coverage for editing business contact, currency, time zone, operating hours, reminder intervals, and reactivation interval in `tests/e2e/workspace-settings.spec.ts`.

### Implementation for User Story 4

- [ ] T049 [US4] Implement owner-only workspace settings read/update validation in `src/features/workspaces/workspace-settings.service.ts`; validate supported currency code, IANA time zone, weekly opening/closing order and closed days, reminder intervals, and reactivation interval.
- [ ] T050 [US4] Implement business settings form and clear field-level validation/errors in `src/app/(dashboard)/settings/business/page.tsx` and `src/features/workspaces/workspace-settings-form.tsx`.
- [ ] T051 [US4] Update appointment scheduling and calendar services to consume the latest authorized workspace time zone and operating hours in `src/features/appointments/appointment.service.ts` and `src/features/appointments/appointment-calendar.tsx`; preserve prior appointment instants and booking-time history.
- [ ] T052 [US4] Update dashboard and follow-up services to use the selected workspace's latest settings in `src/features/dashboard/dashboard.service.ts` and `src/features/messaging/follow-up.service.ts`.

**Checkpoint**: Validate User Story 4 independently with settings integration tests and `tests/e2e/workspace-settings.spec.ts`, then re-run affected appointment and follow-up tests.

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify operational readiness, performance, recovery, documentation, and cross-story quality gates.

- [ ] T053 [P] Add representative fixture data and p95 measurement scripts for customer search, calendar, and dashboard in `tests/performance/fixtures.ts` and `tests/performance/common-queries.test.ts`; document the measured workload and target p95 under 300 ms.
- [ ] T054 [P] Document Firestore backup configuration, restore isolation, and recovery exercise steps in `docs/operations/firestore-backup-recovery.md`; validate the provisional daily backup, 24-hour recovery point, and 8-hour restore assumptions before production.
- [ ] T055 [P] Document consent evidence, supported-market legal review, sender onboarding, and production messaging enablement checks in `docs/operations/messaging-readiness.md`.
- [ ] T056 Audit every Firestore collection and Admin SDK entry point against tenant/role authorization and append the test evidence in `docs/security/tenant-authorization-review.md`.
- [ ] T057 Run all commands and acceptance scenarios in `specs/001-multi-tenant-crm/quickstart.md`; update any stale command/path references in `specs/001-multi-tenant-crm/quickstart.md`.
- [ ] T058 Verify no development secrets or production credentials are committed and record dependency/build/test results in `docs/operations/release-readiness.md`.

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies; complete before app or emulator-backed feature work.
- **Phase 2 Foundational**: Depends on Setup; blocks all user stories.
- **Phase 3 US1 (P1)**: Depends on foundational Firebase/auth boundaries. It supplies memberships, workspace configuration bootstrap, and owner/staff authorization used by later stories.
- **Phase 4 US2 (P1)**: Depends on US1 membership and initial workspace time-zone/operating-hours settings.
- **Phase 5 US3 (P2)**: Depends on US1 workspace authorization and initial workspace interval settings plus US2 customer/appointment records. US3 can be validated against existing configured intervals; US4 later verifies that owner-edited intervals take effect.
- **Phase 6 US4 (P2)**: Depends on US1's workspace settings bootstrap; can proceed in parallel with much of US2, but its final appointment-settings integration depends on US2.
- **Phase 7 Polish**: Depends on all stories selected for release.

### User Story Dependencies

- **US1**: Starts after Foundational; no other user-story dependency. MVP scope candidate.
- **US2**: Requires US1 workspace membership and bootstrap settings; customer/catalog/appointment work is independently testable within an authorized workspace.
- **US3**: Requires US1 authorization/initial workspace settings and US2's customer/appointment data. Automated scheduling also requires a configured approved messaging sender. US4 later validates that owner edits to intervals affect follow-up.
- **US4**: Starts after US1; settings editing can proceed alongside much of US2, while final downstream integration with appointment scheduling depends on US2.

### Parallel Opportunities

- Setup: T002, T003, T004, and T005 can run in parallel after T001's project directory exists (T002-T005 use distinct files).
- Foundation: T009-T011 can run in parallel after T006/T007/T008 foundations are agreed; T007 and T008 share auth assumptions and should be reviewed together.
- US1: T012-T014 are parallel test files; T015 is the schema prerequisite for T017-T020; invitation, authentication UI, and workspace switching can proceed in separate files after shared authorization is ready.
- US2: T021-T024 are parallel test files; T025 and T027 are separate schemas; customer CRUD and catalog CRUD can proceed independently after schemas; appointment work depends on workspace settings and service/professional schemas.
- US3: T034-T037 are parallel test files; dashboard work (T038-T039) and message/consent work (T040-T046) use separate feature folders, with follow-up integration requiring customer/appointment data and workspace intervals.
- US4: T047-T048 are parallel tests; settings UI and service can proceed after settings schema/bootstrap, while T051/T052 integrate with US2/US3 services.
- Polish: T053-T055 can proceed in parallel; T056-T058 follow completed feature implementation and relevant test evidence.

### Dependency Graph

```text
Setup (T001-T005)
  └── Foundational (T006-T011)
        └── US1 (T012-T020)
              ├── US2 (T021-T033)
              │     └── US3 (T034-T046)
              └── US4 (T047-T050)
                    ├── US2 final settings integration (T051)
                    └── US3 scheduling/readiness integration (T052)
        └── US4 may begin after US1 and proceed in parallel with US2/US3; its final read-model integration is tested against US3 outputs
All selected stories ──> Polish (T053-T058)
```

### Parallel Example: User Story 1

```text
After T006-T011 are complete:
Run T012, T013, and T014 concurrently (separate test files).
Once T015 exists, implement T016, T017, T018, and T019 concurrently where shared helper interfaces are stable.
Complete T020 before US2 scheduling implementation so booking validation has initialized workspace settings.
```

### Parallel Example: User Story 2

```text
After US1 and shared schemas are available:
Run T021, T022, T023, and T024 concurrently (separate test files).
Implement T025 and T027 concurrently (customer and catalog schemas are separate).
Then implement T026 and T028 concurrently; complete T029-T033 for appointment workflow and race-safe scheduling.
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Complete User Story 1: authentication, atomic workspace bootstrap, membership/invitation lifecycle, initial settings, role checks, and workspace switching.
3. **Stop and validate** two-workspace isolation, owner/staff permissions, invite lifecycle, and private-route behavior with emulator and E2E tests.
4. Demo workspace onboarding before proceeding to customer and appointment features.

### Incremental Delivery

1. Setup + Foundational → secure application and emulator baseline.
2. US1 → secure workspace onboarding MVP.
3. US2 → customer, catalog, calendar, and race-safe appointment operations.
4. US4 → owner-editable workspace operating settings; coordinate the appointment integration boundary with US2.
5. US3 → dashboard, follow-up, and optional consent-aware messaging.
6. Polish → validate performance, recovery, authorization review, release readiness, and quickstart.

### Notes

- All tasks are individually unchecked and have sequential IDs.
- `[P]` is used only when the task works in separate files and has no unfinished prerequisite.
- Story tasks use `[US1]` through `[US4]`; Setup, Foundational, and Polish tasks have no story label.
- Tests are included because spec success criteria require authorization, isolation, concurrency, performance, messaging-failure, and recovery validation.
- Keep security-rule and Admin SDK authorization paths separate in tests; UI visibility is not proof of access control.

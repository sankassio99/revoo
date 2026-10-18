# Tasks: Public Appointment Booking

**Input**: Design documents from `/specs/004-public-appointment-booking/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/public-booking.md](./contracts/public-booking.md), [quickstart.md](./quickstart.md)

**Tests**: Included because the project constitution requires relevant unit and emulator integration tests for business logic, authorization, tenant isolation, and concurrent appointment invariants.

**Organization**: Tasks are grouped by the three P1 user stories. Only shared public request validation and workspace scoping are blocking foundations; email identity and customer indexing are grouped with the client-identification story.

## Phase 1: Setup

**Purpose**: Prepare repeatable local verification for email-link authentication before story work begins.

- [ ] T001 Document how to exercise Firebase email-link sign-in with the Auth Emulator and verify the production callback origin in `specs/004-public-appointment-booking/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared public request validation and tenant workspace resolution.

- [ ] T002 Create shared public booking schemas for tenant record IDs, 1–20 unique service IDs, `YYYY-MM-DD` dates, `HH:mm` local times, and `YYYY-MM-DDTHH:mm` local starts in `src/features/public-booking/public-booking.schema.ts`
- [ ] T003 Add a server-only workspace resolver in `src/features/public-booking/public-booking.service.ts` that validates the route tenant ID, distinguishes an unknown workspace from unexpected read failures, and returns only the client-facing workspace name and valid configured time zone

**Checkpoint**: The common request and workspace boundary is available; schedule discovery can proceed independently of email identity implementation.

---

## Phase 3: User Story 1 - Find a suitable appointment (Priority: P1) 🎯 MVP

**Goal**: Let a visitor see active professionals and services, select a professional and services, and view accurate available local start times for a date.

**Independent Test**: Open a workspace's public booking page, select an eligible professional and services, and verify displayed times follow the workspace time zone and hours, 15-minute opening-aligned grid, service duration, service assignments, and existing appointment conflicts; verify closed/no-slot dates are explained.

### Tests for User Story 1

- [ ] T004 [P] [US1] Add unit tests for service compatibility, 15-minute opening-aligned slot generation, service duration, overlapping intervals, closed days, past dates, and time-zone boundaries in `tests/domain/public-booking-availability.test.ts`
- [ ] T005 [P] [US1] Add emulator integration tests for public booking-option field allow-lists, active professional/service filtering, tenant isolation, and availability excluding occupied or ineligible times in `tests/integration/public-booking-options.test.ts`

### Implementation for User Story 1

- [ ] T006 [P] [US1] Implement allow-listed workspace, active service, and active professional booking-option projections in `src/features/public-booking/public-catalog.service.ts`; return only contract fields and reject an unknown workspace
- [ ] T007 [US1] Implement daily availability calculation in `src/features/public-booking/availability.service.ts` using workspace `operatingHours` and time zone, current active services/professional assignments, combined duration and price, non-cancelled appointment intervals, and start times on a 15-minute grid aligned to opening
- [ ] T008 [US1] Add `GET` booking-options route with validated tenant path, explicit public response projection, and generic logged unexpected errors in `src/app/api/public/workspaces/[tenantId]/booking-options/route.ts`
- [ ] T009 [US1] Add `GET` availability route validating `professionalId`, 1–20 unique `serviceIds`, and `YYYY-MM-DD` date, then return local available start times and aggregate duration/price in `src/app/api/public/workspaces/[tenantId]/availability/route.ts`
- [ ] T010 [US1] Build the client-facing selection flow in `src/features/public-booking/booking-selection.tsx` for professional, services, date, and time; show workspace time zone, empty states, invalidated-selection guidance, and keep the chosen selection available for subsequent steps
- [ ] T011 [US1] Add the public workspace booking page in `src/app/book/[tenantId]/page.tsx` and connect it to the booking-options and availability routes without exposing tenant records directly

**Checkpoint**: User Story 1 works without client authentication and can be demonstrated by selecting a valid professional, service set, date, and available time.

---

## Phase 4: User Story 2 - Identify or register as a client (Priority: P1)

**Goal**: Verify email ownership without exposing customer existence to an unverified visitor, then resolve an existing client or register a new one while preserving the booking selection.

**Independent Test**: For an existing and a new email, complete email-link verification; confirm only the verified flow resolves the client, new registration requires name and phone, existing clients are not re-registered, and the selected professional/services/date/time survive the link round trip.

### Tests for User Story 2

- [ ] T012 [P] [US2] Add emulator integration tests for missing session, unverified email, existing client resolution, no-match registration path, archived/ambiguous email matches, identity-field spoofing, and cross-tenant identity lookup in `tests/integration/public-booking-identity.test.ts`
- [ ] T013 [P] [US2] Add unit tests for registration validation: name is trimmed to 2–120 characters; phone is trimmed to 7–24 characters and has at least seven digits after non-digits are removed; email is trimmed, valid, and at most 254 characters in `tests/domain/public-booking-identity.test.ts`
- [ ] T014 [P] [US2] Add emulator integration tests for staff customer create/update/archive email-index maintenance and backfill duplicate handling in `tests/integration/customer-email-index.test.ts`

### Implementation for User Story 2

- [ ] T015 [US2] Add a server-only verified-booking-user helper in `src/features/public-booking/public-booking-auth.ts` that requires a valid session, `emailVerified === true`, and a non-empty email; derive UID/email only from the session and never accept identity fields from request bodies
- [ ] T016 [US2] Add a shared email-index key helper in `src/features/customers/customer-email-index.ts` that trims and lowercases email and derives a tenant-scoped SHA-256 document key without storing raw or normalized email in the index
- [ ] T017 [US2] Update `src/features/customers/customer.service.ts` so customer create, email change, and archive atomically create, replace, and remove the tenant customer-email index while preserving existing staff authorization and customer behavior
- [ ] T018 [US2] Add a one-time customer email-index backfill and duplicate-reporting utility in `scripts/backfill-customer-email-index.ts`; scope every read/write by tenant, skip records without valid email, and do not overwrite ambiguous index keys
- [ ] T019 [US2] Implement verified-session email lookup in `src/features/public-booking/public-client.service.ts` using the tenant-scoped hashed index; return one minimal active client projection, require registration when no match exists, and return a safe conflict for ambiguous matches
- [ ] T020 [US2] Implement atomic public client registration in `src/features/public-booking/public-client.service.ts` using only verified session email, defaulting unspecified communication preferences to `unknown`, and idempotently resolving repeated registration for the same verified identity
- [ ] T021 [US2] Add `POST` client lookup/registration route in `src/app/api/public/workspaces/[tenantId]/client/route.ts`; require verified booking identity, validate the registration body, map safe 400/401/403/404/409 errors, and log unexpected failures
- [ ] T022 [US2] Implement Firebase email-link request and completion in `src/features/public-booking/email-link-auth.tsx`; send the same response for every valid email, establish the existing verified server session after link completion, and never include customer-match details before verification
- [ ] T023 [US2] Add the workspace-scoped email-link return page in `src/app/book/[tenantId]/verify/page.tsx`; validate link state, complete Firebase email-link sign-in, exchange the ID token through `/api/session`, and restore pending selection from session storage without placing sensitive selection data in the link URL
- [ ] T024 [US2] Add the client identification and new-client registration step in `src/features/public-booking/client-identification.tsx`; resolve existing clients after verification, collect required name/phone for new clients, and preserve selection on errors and back navigation
- [ ] T025 [US2] Connect the selection and identity components in `src/app/book/[tenantId]/page.tsx` so verified existing clients proceed directly and verified new clients proceed after successful registration

**Checkpoint**: Both email paths can be independently exercised; an unverified visitor cannot distinguish existing from new customer records, and booking selections survive verification.

---

## Phase 5: User Story 3 - Confirm an appointment (Priority: P1)

**Goal**: Recheck all booking facts at submission, atomically create one non-conflicting appointment, and show an accurate confirmation or recoverable stale-slot message.

**Independent Test**: Submit a verified client's booking for an available slot and verify one appointment and matching confirmation; then make a selected slot unavailable before submit and verify the request creates no conflicting appointment and returns the client to time selection.

### Tests for User Story 3

- [ ] T026 [P] [US3] Add emulator integration tests for verified-client appointment creation, cross-tenant and spoofed-customer rejection, concurrent overlapping submissions, adjacent slots, stale/unavailable slots, and per-service name/duration/price snapshots in `tests/integration/public-booking-appointments.test.ts`
- [ ] T027 [P] [US3] Add unit tests for public appointment request validation and mapping a stored UTC interval to confirmation local start/end in the workspace time zone in `tests/domain/public-booking-appointments.test.ts`

### Implementation for User Story 3

- [ ] T028 [US3] Implement public appointment creation in `src/features/public-booking/public-appointment.service.ts`; derive customer ID from verified email index, reread current workspace/client/professional/services/settings in the transaction, validate aggregate service details and hours, call the existing schedule guard, write one appointment with per-service and aggregate snapshots, and update the professional schedule guard
- [ ] T029 [US3] Add `POST` appointment route in `src/app/api/public/workspaces/[tenantId]/appointments/route.ts`; accept only professional ID, 1–20 unique service IDs, and local start, require verified identity, ignore caller-supplied customer/pricing/duration/end-time values, and return 409 on conflict
- [ ] T030 [US3] Add confirmation view in `src/features/public-booking/booking-confirmation.tsx` showing workspace, professional, every service and its booked details, local start/end, time zone, and scheduled status from the server response
- [ ] T031 [US3] Connect final confirmation and stale-slot recovery in `src/app/book/[tenantId]/page.tsx`; refresh availability and preserve professional/services/date when the final transaction returns a conflict

**Checkpoint**: A verified client can create a booking that remains conflict-free at commit and sees confirmation values derived from the persisted appointment.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify the complete journey, privacy boundaries, accessibility, and documented local workflow.

- [ ] T032 [P] Add Playwright coverage for existing-client booking, new-client email-link registration, selection restoration, confirmation details, and stale-slot recovery in `tests/e2e/public-booking.spec.ts`
- [ ] T033 [P] Review public booking routes and response mappers for tenant scoping, customer enumeration, untrusted redirect origins, caller-supplied identity, and internal-field exposure; record findings and fixes in the affected `src/features/public-booking/` and `src/app/api/public/workspaces/[tenantId]/` files
- [ ] T034 Run the domain/integration/e2e commands and expected outcomes documented in `specs/004-public-appointment-booking/quickstart.md`; fix failures in the affected source or test files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Independent documentation for Auth Emulator email-link validation.
- **Foundational (Phase 2)**: Depends on setup; shared request validation and workspace scoping block all user stories.
- **User Stories (Phases 3–5)**: US1 and US2 can start independently after Phase 2, then US3 integrates the verified-client identity contract from US2 with the professional/service/time selection contract from US1.
- **Polish (Phase 6)**: Requires all three stories to be integrated.

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2. Independently demonstrates workspace options and available slots.
- **US2 (P1)**: Depends on Phase 2. Its email-index maintenance, migration, and verification flow can be tested independently with an isolated selection fixture; its final booking-page integration connects to US1.
- **US3 (P1)**: Depends on Phase 2, the verified-client resolution contract from US2, and the professional/service/local-start selection contract from US1.

### Within Each User Story

- Write the story's tests before implementation and verify they fail for the intended missing behavior.
- Keep story business services separate so US1/US2/US3 implementation can proceed concurrently without conflicting edits.
- Implement services before their route handlers; integrate UI after route contracts exist.
- Complete each story's independent test before moving to full-flow polish.

### Parallel Opportunities

- T002 and T003 touch separate files and can proceed independently after T001.
- T004 and T005 can run in parallel; public option mapping (T006) can proceed alongside availability calculation (T007).
- T012–T014 test files can be developed in parallel; email-index maintenance (T016–T018) can proceed alongside the public-client lookup/registration service (T019–T020) once the hash helper is agreed.
- T026 and T027 can run in parallel; confirmation UI (T030) can proceed alongside endpoint implementation (T029) after the response shape is agreed.
- T032 and T033 are separate polish activities.
- US1 and US2 can be staffed in parallel after Phase 2; US3 should integrate after their contracts are stable.

## Parallel Example: User Story 1

```text
Task T004: Unit coverage for availability calculation in tests/domain/public-booking-availability.test.ts
Task T005: Emulator coverage for public options and availability routes in tests/integration/public-booking-options.test.ts
Task T006: Public booking-option projection in src/features/public-booking/public-catalog.service.ts
Task T007: Daily availability calculation in src/features/public-booking/availability.service.ts
```

## Parallel Example: User Story 2

```text
Task T012: Emulator identity and registration coverage in tests/integration/public-booking-identity.test.ts
Task T013: Registration validation coverage in tests/domain/public-booking-identity.test.ts
Task T014: Customer email-index maintenance and backfill tests in tests/integration/customer-email-index.test.ts
Task T015: Verified booking identity helper in src/features/public-booking/public-booking-auth.ts
```

## Parallel Example: User Story 3

```text
Task T026: Appointment transaction and conflict coverage in tests/integration/public-booking-appointments.test.ts
Task T027: Request and confirmation time conversion tests in tests/domain/public-booking-appointments.test.ts
Task T028: Guarded appointment creation in src/features/public-booking/public-appointment.service.ts
Task T030: Confirmation display in src/features/public-booking/booking-confirmation.tsx
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2 so public reads have common request and workspace boundaries.
2. Complete Phase 3 and validate active options, available slots, workspace time zone, no-availability states, and public field allow-lists independently.
3. Stop for MVP review before enabling email-link identity and appointment writes; US1 alone is a schedule-discovery increment, not a complete booking product.

### Incremental Delivery

1. Complete Setup + Foundational and verify shared request validation and tenant-scoped workspace lookup.
2. Deliver US1 as the independently testable public schedule-selection increment.
3. Deliver US2 and verify both existing/new client identity paths without exposing customer existence before verification; backfill legacy customer email indexes before enabling public booking.
4. Deliver US3 and verify guarded creation, conflict recovery, snapshots, and confirmation.
5. Complete Phase 6 and run the full quickstart validation.

## Notes

- `[P]` marks only tasks that work on distinct files and do not depend on incomplete tasks.
- Story labels correspond to the priorities and titles in `specs/004-public-appointment-booking/spec.md`.
- Public API work must not relax Firestore Rules or the existing workspace-member checks on staff routes.
- Customer email index lookup keys contain a digest, not raw or normalized email.
- The 15-minute grid is aligned to workspace opening time; professional-specific hours and time off are out of scope.
- This feature does not include payments, cancellation, rescheduling, or automated confirmation delivery.

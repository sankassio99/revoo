# Research: Public Appointment Booking

**Date**: 2026-10-18  
**Scope**: Resolve design decisions for the public scheduling flow using current repository patterns.

## Decision 1: Use a separate public booking service and allow-listed public endpoints

**Decision**: Add public booking routes under `/api/public/workspaces/{tenantId}` and implement their data access in a server-only service. Do not make staff catalog, customer, or appointment routes public.

**Rationale**: Existing workspace routes require a verified session and workspace membership. Their service layer uses Firebase Admin and performs explicit authorization. Firestore rules likewise restrict workspace records to members. Public operations must deliberately select only data needed to book, without widening those existing permissions.

**Alternatives considered**:
- Allow unauthenticated Firestore reads of tenant catalog and schedule data: rejected because rules would expose whole tenant records and bypass response-field filtering.
- Reuse staff routes with a public bypass: rejected because it weakens a well-defined staff authorization boundary.

## Decision 2: Verify client email before matching a customer record

**Decision**: Use Firebase Authentication email-link sign-in for the public client flow. Require a verified Firebase identity before customer lookup or booking. Return the same initial message for any syntactically valid email, then determine whether registration is needed after verification.

**Rationale**: The feature must associate bookings with CRM customer records without exposing customer existence to arbitrary visitors. Passwordless verification is appropriate for an email-first public booking flow and avoids asking returning clients to create a password. The app already uses Firebase Authentication and rejects unverified users when establishing sessions, although the current staff sign-in UI uses email/password.

**Alternatives considered**:
- Reveal whether a customer record exists immediately after email entry: rejected because it permits account enumeration.
- Require a new password for every booker: rejected because it adds friction and is unnecessary for a single booking flow.
- Accept the email without proof of ownership: rejected because an attacker could book against another customer's record.

**Integration constraint**: Email-link authentication needs the production and emulator action settings, authorized return URL, and pending-booking state restoration. Do not disclose a customer match until the link is completed and the verified session is established.

## Decision 3: Match customer records by a normalized email identity and reject ambiguous matches

**Decision**: Normalize verified email by trimming and lowercasing, then derive a SHA-256 key for a tenant-scoped customer-email index. Store the customer ID in the index, not the raw email or its normalized form. Existing customer records must be indexed before public booking is enabled; if a workspace contains duplicate matching records, do not choose one automatically and return a safe resolution error.

**Rationale**: Current customer records store email but do not normalize it or provide an email lookup path. A dedicated tenant-scoped lookup prevents case-variant misses and avoids scanning an unbounded customer collection. Hashing the normalized lookup key avoids duplicating customer email in a second Firestore field. Ambiguous identities must not silently merge customer histories.

**Alternatives considered**:
- Scan all customer documents and compare email in application code: rejected because query cost and latency grow with workspace size.
- Match exact email only: rejected because existing records may contain casing or whitespace differences.
- Choose the first duplicate match: rejected because that can associate a booking with the wrong customer.

## Decision 4: Availability uses configured workspace operating hours and current professional/service eligibility

**Decision**: Calculate daily slots using the workspace time zone and existing weekly operating hours, existing appointment intervals, active professional status, assigned active services, and combined service duration. Offer start times on a 15-minute grid, aligned to the workspace opening time. In this first version, all active professionals share the workspace's configured operating hours; per-professional working schedules are not introduced.

**Rationale**: Workspace settings currently provide the only configured working schedule. Professionals currently have active status and service assignments but no individual working hours or slot increment. Reusing those settings and a conventional 15-minute choice interval delivers a truthful schedule without creating an unsupported schedule-management feature.

**Alternatives considered**:
- Add professional-level weekly hours as part of this feature: rejected because neither the current data model nor staff UI configures them, expanding scope beyond public booking.
- Display all clock times without accounting for duration or existing bookings: rejected because those times cannot be safely booked.
- Use a different configurable slot increment: rejected because no current workspace setting supports it; 15 minutes is a documented initial default.

**Public link assumption**: The workspace identifier in `/book/{tenantId}` is an opaque shareable URL component. The workspace chooses to share that link with clients; public responses include only client-facing workspace, professional, service, and availability fields. No owner-managed publication toggle or custom slug is introduced in this scope.

## Decision 5: Final appointment creation reuses the schedule-guard transaction invariant

**Decision**: Share the existing appointment validation and conflict-guard behavior for public creation. The server derives the customer identity from the verified session and the service duration/prices from current tenant records; it ignores client-submitted customer IDs and calculated totals. Preserve per-service name, duration, and price snapshots in addition to the appointment's aggregate duration and price.

**Rationale**: Existing appointment creation checks active customer/service/professional records, operating hours, service snapshots, and conflicts while using a per-professional schedule guard in a Firestore transaction. The public path needs the same business invariants but cannot call the staff-only creation function without workspace membership. Per-service snapshots let the confirmation list the selected services and preserve exactly what was booked if catalog entries change later.

**Alternatives considered**:
- Trust a slot returned earlier by availability: rejected because another booking or catalog change can invalidate it before submission.
- Duplicate schedule-conflict logic in the public route: rejected because the two booking paths could drift.

## Repository evidence

- `src/features/appointments/appointment.service.ts` validates booking records and calculates a service snapshot during appointment creation.
- `src/features/appointments/schedule-guard.ts` and `tests/integration/appointments.test.ts` provide a transaction-based conflict guard and concurrency coverage.
- `src/lib/domain/time.ts` provides local-time and UTC conversion helpers; `src/features/appointments/appointment.service.ts` uses workspace `operatingHours`.
- `src/features/catalog/catalog.service.ts` stores professional service assignments and service/professional active status.
- `src/features/customers/customer.service.ts` stores customer details but currently requires workspace membership and does not index email.
- `src/lib/auth/session.ts` exposes verified session email state; `src/app/api/session/route.ts` rejects unverified Firebase identities.
- `firestore.rules` denies unauthenticated reads of tenant collections, so public reads must go through explicit server-side response filtering.

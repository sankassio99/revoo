# Data Model: Public Appointment Booking

This design reuses the tenant-scoped Firestore records described below. Public booking responses are projections, not direct document contents.

## Workspace booking context

**Source**: `tenants/{tenantId}` and `tenants/{tenantId}/settings/general`

| Field | Meaning | Validation / behavior |
|---|---|---|
| `tenantId` | Workspace's tenant identifier used to scope the booking flow | Must resolve to one existing workspace; never accept a tenant ID from a body when it conflicts with the route |
| `name` | Client-facing workspace name | Return only this public field |
| `timeZone` | Workspace's authoritative time zone | Must be a valid configured zone; applies to schedule display and appointment conversion |
| `operatingHours` | Weekly business hours | Closed days have no slots; the complete appointment must fit within opening hours |

## Professional

**Source**: `tenants/{tenantId}/professionals/{professionalId}`

| Field | Meaning | Validation / behavior |
|---|---|---|
| `name` | Client-facing professional name | Return only when status is `active` |
| `serviceIds` | Services this professional can perform | Must include every selected active service |
| `status` | Booking eligibility | Only `active` professionals can be offered or booked |

Professionals share workspace operating hours in this version. Individual professional hours and time off are not represented in the current product model and are out of scope.

## Service

**Source**: `tenants/{tenantId}/services/{serviceId}`

| Field | Meaning | Validation / behavior |
|---|---|---|
| `name` | Client-facing service name | Return only for active services |
| `durationMinutes` | Service length | Must be a positive safe integer; sum selected service durations |
| `priceMinorUnits` | Current service price | Must be a nonnegative safe integer; sum for display and snapshot |
| `status` | Booking eligibility | Must remain `active` at final booking |

## Public booking email

**Source**: Email supplied by the visitor and checked against the workspace customer index

| Field | Meaning | Validation / behavior |
|---|---|---|
| `email` | Client email address | Required; validate and normalize with trim and lowercase before matching or indexing; control of the address is not verified |

The public booking email does not create an authenticated user or grant workspace-member privileges.

## Customer

**Source**: `tenants/{tenantId}/customers/{customerId}`

| Field | Meaning | Validation / behavior |
|---|---|---|
| `name` | Client's display name | Required for a newly registered client; trim and validate to 2–120 characters |
| `phone` | Client contact number | Required for registration; trim to 7–24 characters and require at least seven digits after removing non-digits |
| `email` | Client's contact email | Equal to the provided email for public registration; trimmed, valid, and at most 254 characters |
| `isArchived` / `archivedAt` | Customer eligibility | Archived clients cannot make a new booking |
| `communicationPreferences` | Consent-aware communications state | New public registrations default all unspecified preferences to `unknown`; marketing consent is not implied |

Lookup is scoped to the workspace. A single active matching record is used. No match presents registration; multiple matching active records must stop the flow with a safe support/resolution message rather than selecting arbitrarily.

## Appointment

**Source**: `tenants/{tenantId}/appointments/{appointmentId}`

| Field | Meaning | Validation / behavior |
|---|---|---|
| `customerId` | Resolved or newly registered client record | Resolved server-side from the provided email; not accepted as an authoritative public input |
| `professionalId` | Selected professional | Must still exist, be active, and be assigned all selected services |
| `serviceIds` | Selected services | Unique, non-empty set of currently active services belonging to this workspace |
| `startAtUtc`, `endAtUtc` | Stored appointment interval | Derive from requested local date/time in workspace time zone and current aggregate service duration |
| `timeZoneAtBooking` | Time zone applied during booking | Snapshot of workspace setting at booking time |
| `serviceSnapshot` | Per-service names, durations, and prices plus aggregate duration and total price as booked | Derive from current service records in final transaction; preserve against future catalog edits |
| `status` | Appointment lifecycle state | New booking is `Scheduled` |
| `createdBy` | Audit identity | `public-booking` for a booking submitted through the unauthenticated public flow |
| `createdAt`, `updatedAt`, `changeHistory` | Audit metadata | Server-generated |

## Availability result

An ephemeral response, not a persisted entity:

- workspace name and time zone
- selected date
- eligible professionals and active services
- available local start times on a 15-minute grid for one professional and service selection
- combined duration and price for the selected services

Slot results are advisory only. The final appointment transaction recalculates eligibility and rejects conflicts before writing.

## Identity index

**Source**: `tenants/{tenantId}/customerEmailIndex/{emailKey}`

The index associates one normalized email with one active customer ID to make exact tenant-scoped identity lookup efficient. Derive the document key as a deterministic SHA-256 digest of the trimmed, lowercased email; store no raw or normalized email in this index. Creating or updating an index and its customer must be atomic. Existing records need a backfill that detects collisions; duplicate emails must be resolved before a unique mapping is enabled. Index access is server-only and is never returned publicly.

## State transitions

1. `selection` → client has workspace, professional, services, and date/time.
2. `email_lookup` → visitor enters an email and the server checks for a workspace-scoped match.
3. `existing_client` → provided email resolves to one active customer.
4. `registration_required` → provided email has no matching customer; collect name and phone.
5. `ready_to_confirm` → identity/customer and selection are valid.
6. `confirmed` → final transaction succeeds and creates one scheduled appointment.
7. `slot_unavailable` → final validation rejects a conflict; return to time selection while preserving other selections.
8. `identity_or_registration_error` → email lookup or registration fails; show an error and retain recoverable selection state.

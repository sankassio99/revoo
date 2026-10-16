# Data Model: Multi-Tenant CRM for Service Businesses

**Source**: [spec.md](./spec.md), [requirements.md](../../requirements.md)

## Modeling Rules

- Every operational record belongs to exactly one workspace (`tenantId`). Store it beneath the
  workspace's data path and never infer authorization only from a supplied ID or URL.
- A person may have memberships in multiple workspaces. Resolve the active workspace per request
  and authorize its membership and role before any operation.
- Use stable opaque identifiers for users, workspaces, and records. A business display name or
  email address is not a record identifier.
- Store currency amounts as integer minor units with a currency code, not floating point values.
- Store appointment instants in UTC and preserve the IANA time-zone identifier used at booking.
  Convert only at the business/user presentation boundary.
- Use server timestamps for audit fields. Changes to membership, appointments, consent, and
  messaging delivery are attributable events, not silent overwrites.

## Entities

### User

Represents an authenticated person.

| Field | Meaning / validation |
|------|-----------------------|
| `userId` | Stable identity supplied by the authentication provider; unique. |
| `email` | Optional profile/contact value; normalize for matching, not authorization by itself. |
| `displayName` | Optional display name. |
| `createdAt` | Server creation timestamp. |

Relationship: one user may have many `Membership` records, one per workspace.

### Workspace

Represents one business tenant and its operational settings.

| Field | Meaning / validation |
|------|-----------------------|
| `tenantId` | Unique opaque workspace identifier. |
| `name` | Required business/workspace name. |
| `contact` | Business contact details needed by the CRM. |
| `currency` | Required supported currency code. |
| `timeZone` | Required valid IANA time-zone identifier. |
| `operatingHours` | Business-local weekly schedule; validate opening/closing order and closed days. |
| `reminderSettings` | Workspace-specific reminder intervals and enabled states. |
| `reactivationInterval` | Workspace-specific non-return interval. |
| `createdAt`, `updatedAt` | Server timestamps. |

Relationships: owns memberships, invitations, customers, services, professionals, appointments,
campaigns, and message records. Workspace settings must never be read across tenants.

### Membership

Represents a user's permission within one workspace.

| Field | Meaning / validation |
|------|-----------------------|
| `userId` | Authenticated user identifier; unique within workspace. |
| `role` | `owner` or `staff`. |
| `status` | `active` or `revoked`. Pending access is represented by an `Invitation`, not an active membership. |
| `createdAt`, `updatedAt` | Server timestamps. |
| `revokedAt` | Set when access is revoked; absent while active. |

Permissions: staff may manage customers and appointments. Owners may also manage services,
professionals, workspace settings, and invitations. All roles remain subject to workspace
membership and tenant-isolation checks.

### Invitation

Represents an owner-issued staff invitation.

| Field | Meaning / validation |
|------|-----------------------|
| `invitationId` | Unique opaque invitation identifier. |
| `emailNormalized` | Intended invitee; acceptance must match the authenticated account. |
| `role` | `staff` for this MVP. |
| `status` | `pending`, `accepted`, `expired`, or `revoked`. |
| `expiresAt` | Required expiry timestamp. |
| `createdBy`, `createdAt` | Owner identity and server timestamp. |
| `acceptedBy`, `acceptedAt` | Set only after verified acceptance. |

An invitation grants no workspace access until acceptance atomically creates an active
membership. Revoked or expired invitations cannot be accepted.

### Customer

Represents a workspace-owned CRM contact.

| Field | Meaning / validation |
|------|-----------------------|
| `customerId` | Unique within workspace. |
| `name` | Required customer name. |
| `phone` | Required contact number for WhatsApp workflows; normalize for search. |
| `email` | Optional email address. |
| `notes` | Optional business notes; restricted to authorized workspace members. |
| `communicationPreferences` | Separate `unknown`, `granted`, or `denied` state for WhatsApp service messages, WhatsApp marketing, and email marketing. |
| `consentEvidence` | Append-only evidence entries containing state, purpose, channel, capture time, source user, and capture method. |
| `nameNormalized`, `phoneNormalized` | Derived normalized values used for workspace-scoped duplicate detection. |
| `searchTerms` | Derived name-prefix and phone-digit-prefix terms used for workspace-scoped search. |
| `isArchived` | Queryable active/archive marker; `false` while active and `true` when archived. |
| `archivedAt` | Absent while active; set on archive. |
| `lastVisitAt` | Most recent completed appointment instant; updated transactionally when an appointment is completed. |
| `createdAt`, `updatedAt` | Server timestamps. |

Possible-duplicate detection is advisory within the same workspace. It does not automatically
merge customer records. A customer's communications and appointment history remain workspace
scoped.

### Service

Represents an offering that can be booked.

| Field | Meaning / validation |
|------|-----------------------|
| `serviceId` | Unique within workspace. |
| `name` | Required display name. |
| `durationMinutes` | Positive duration; booking increment/maximum is a planning constraint to be measured before implementation. |
| `priceMinorUnits` | Non-negative integer amount in the workspace currency. |
| `status` | `active` or `inactive`. |
| `createdAt`, `updatedAt` | Server timestamps. |

An edit changes future bookings only. Existing appointments retain a snapshot of the service's
name, duration, and price at booking time.

### Professional

Represents an active or inactive service provider in a workspace.

| Field | Meaning / validation |
|------|-----------------------|
| `professionalId` | Unique within workspace. |
| `name` | Required display name. |
| `status` | `active` or `inactive`. |
| `serviceIds` | Set of services this professional may perform; each reference must belong to the same workspace. |
| `createdAt`, `updatedAt` | Server timestamps. |

Inactive professionals remain referentially available for appointment history but cannot be
selected for new bookings.

### Appointment

Represents a customer booking with a professional and service.

| Field | Meaning / validation |
|------|-----------------------|
| `appointmentId` | Unique within workspace. |
| `customerId`, `professionalId`, `serviceId` | Required references to records in the same workspace. |
| `startAtUtc`, `endAtUtc` | Required instants with `endAtUtc > startAtUtc`; end is calculated from the booking-time duration. |
| `timeZoneAtBooking` | Valid IANA time zone used to interpret/display the booking at creation or reschedule. |
| `serviceSnapshot` | Booking-time service name, duration in minutes, and price in minor units. |
| `status` | `Scheduled`, `Confirmed`, `Completed`, `Cancelled`, or `NoShow`. |
| `amountChargedMinorUnits` | Optional non-negative integer in the workspace currency. |
| `createdAt`, `updatedAt` | Server timestamps. |
| `changeHistory` | Append-only relevant actor, time, changed fields, and prior/new state. |

Conflict validation compares full intervals for the same professional in the same workspace.
Cancelled appointments do not reserve time; completed and no-show appointments remain history.
Create/reschedule/cancel operations use one shared schedule guard per professional in the
transaction that validates and writes the appointment. The guard is internal coordination data,
not user-visible business content.

### Campaign

Represents a workspace-scoped reminder or reactivation campaign definition.

| Field | Meaning / validation |
|------|-----------------------|
| `campaignId` | Unique within workspace. |
| `purpose` | Appointment confirmation, reminder, or marketing reactivation. |
| `status` | `draft`, `active`, `paused`, or `completed`. |
| `intervalSettings` | Workspace-local interval and eligibility settings. |
| `createdAt`, `updatedAt` | Server timestamps. |

Marketing reactivation is only eligible for customers with current marketing permission.
Consent is rechecked at send time, not only when constructing a candidate list.

### Message Record

Represents one attempted communication and its known delivery outcome.

| Field | Meaning / validation |
|------|-----------------------|
| `messageId` | Unique within workspace. |
| `customerId` | Required same-workspace recipient. |
| `appointmentId` | Optional same-workspace appointment reference. |
| `campaignId` | Optional same-workspace campaign reference. |
| `purpose` | Confirmation, reminder, or marketing reactivation. |
| `deduplicationKey` | Unique send occurrence derived from workspace, recipient, purpose/campaign, and period. |
| `providerMessageId` | Optional provider-assigned ID; unique when present. |
| `status` | `queued`, `sent`, `delivered`, `read`, `failed`, or `suppressed`. |
| `failureCategory` | Optional transient, permanent, policy, or provider failure category. |
| `createdAt`, `updatedAt` | Server timestamps. |

Webhook status processing is idempotent by provider message ID and event/status. A send attempt
must have a unique deduplication key so retries do not send the same occurrence twice.

## Appointment State Transitions

The requirements define the available states but not every transition. Use the following MVP
transition policy unless product owners revise it:

| Current state | Allowed next states |
|--------------|---------------------|
| `Scheduled` | `Confirmed`, `Completed`, `Cancelled`, `NoShow` |
| `Confirmed` | `Scheduled`, `Completed`, `Cancelled`, `NoShow` |
| `Completed` | None; correct a recording through a separately audited administrative action. |
| `Cancelled` | None; create a new appointment if the customer books again. |
| `NoShow` | None; correct a recording through a separately audited administrative action. |

Rescheduling changes the time interval and adds a history event. Status is preserved unless the
actor explicitly performs a valid status transition. Any time change re-runs conflict,
professional eligibility, duration, and operating-hours validation.

## Tenant-Scoped Record Layout

The following is a logical layout consistent with the source requirements; exact document
boundaries and query indexes are implementation decisions:

```text
users/{userId}
tenants/{tenantId}
tenants/{tenantId}/members/{userId}
tenants/{tenantId}/invitations/{invitationId}
tenants/{tenantId}/customers/{customerId}
tenants/{tenantId}/services/{serviceId}
tenants/{tenantId}/professionals/{professionalId}
tenants/{tenantId}/appointments/{appointmentId}
tenants/{tenantId}/scheduleGuards/{professionalId}
tenants/{tenantId}/campaigns/{campaignId}
tenants/{tenantId}/messageLogs/{messageId}
tenants/{tenantId}/settings/general
```

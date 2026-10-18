# Public Booking Interface Contract

All endpoints are workspace-scoped by the `tenantId` path segment and return JSON. They use server-side Firestore access; they do not grant anonymous Firestore access. Request bodies must be schema-validated and bounded. Responses must use explicit allow-lists and must not include staff, customer, or internal workspace fields.

## Authentication

- Public catalog and availability are unauthenticated read operations.
- Client lookup, registration, and appointment creation require a valid Firebase session for a user whose email is verified.
- The server derives the client's UID and verified email from the session; caller-supplied identity values are ignored or rejected.
- Until email verification succeeds, response content must not reveal whether the email matches a customer.
- Authenticated client identity does not confer workspace membership or access to staff routes.

## `GET /api/public/workspaces/{tenantId}/booking-options`

Returns the public workspace name and time zone, active services, and active professionals with their compatible service IDs. No customer, member, setting, or other internal fields are returned.

**Success `200`**

```json
{
  "workspace": { "name": "Example Studio", "timeZone": "Europe/London" },
  "services": [
    { "id": "service-id", "name": "Consultation", "durationMinutes": 30, "priceMinorUnits": 5000 }
  ],
  "professionals": [
    { "id": "professional-id", "name": "Alex", "serviceIds": ["service-id"] }
  ]
}
```

**Errors**: `404` for unknown workspace; `500` with a generic error body for unexpected failures.

## `GET /api/public/workspaces/{tenantId}/availability`

**Query**:
- `professionalId`: required ID of one active workspace professional.
- `serviceIds`: one or more unique selected service IDs (bounded to 20).
- `date`: required local date in `YYYY-MM-DD` format.

The result accounts for workspace operating hours and time zone, active status and service assignments, aggregate service duration, current non-cancelled appointments, and interval overlap. Every start time is a local time in the workspace time zone. The schedule result is not a reservation.

**Success `200`**

```json
{
  "date": "2026-10-19",
  "timeZone": "Europe/London",
  "durationMinutes": 60,
  "priceMinorUnits": 10000,
  "availableTimes": ["09:00", "10:00"]
}
```

**Errors**: `400` for malformed or incompatible selections; `404` for an unknown workspace or selection; `500` for unexpected failures.

## `POST /api/public/workspaces/{tenantId}/client`

Requires a verified Firebase session. Resolves the session email against the tenant's normalized customer email index.

**Existing customer success `200`**

```json
{ "client": { "id": "customer-id", "name": "Client name" }, "registrationRequired": false }
```

The endpoint returns no customer record before verification. It returns only the minimum client detail needed to continue booking.

**No matching customer `404`**

```json
{ "registrationRequired": true }
```

This response is available only after verified authentication.

**Registration request**

```json
{ "name": "Client name", "phone": "+441234567890" }
```

The endpoint uses the verified session email; an email supplied in the body is not authoritative. It creates the customer and normalized-email index atomically with default communication preferences set to `unknown`. Repeated requests for the same verified identity resolve idempotently to the same customer.

**Registration success `201`**

```json
{ "client": { "id": "customer-id", "name": "Client name" }, "registrationRequired": false }
```

**Errors**: `400` for invalid registration; `401` for missing/invalid session; `403` for an unverified email; `409` for an ambiguous/duplicate customer identity; `500` for unexpected failures.

## `POST /api/public/workspaces/{tenantId}/appointments`

Requires a verified Firebase session and a resolved client identity. Revalidate all selected workspace records and slot availability during the final create transaction. Do not trust a `customerId`, price, duration, time zone, or end time from the request.

**Request**

```json
{
  "professionalId": "professional-id",
  "serviceIds": ["service-id"],
  "localStart": "2026-10-19T09:00"
}
```

**Success `201`**

```json
{
  "appointment": {
    "id": "appointment-id",
    "workspaceName": "Example Studio",
    "professionalName": "Alex",
    "services": [{ "name": "Consultation", "durationMinutes": 30, "priceMinorUnits": 5000 }],
    "localStart": "2026-10-19T09:00",
    "localEnd": "2026-10-19T09:30",
    "timeZone": "Europe/London",
    "status": "Scheduled"
  }
}
```

**Errors**: `400` for invalid selection; `401` for missing/invalid session; `403` for an unverified email; `404` for a workspace or client identity that cannot be resolved; `409` when the slot is no longer available; `500` for unexpected failures. A conflict response creates no appointment and allows the client to select another time.

## Email verification callback

The public page initiates Firebase email-link authentication and restores the pending booking selection after the verified link returns to the authorized workspace booking URL. The callback must validate state and allow-listed return origins, establish the existing server session only after Firebase verifies the identity, and avoid including customer IDs or sensitive booking details in the link URL.

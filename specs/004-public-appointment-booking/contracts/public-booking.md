# Public Booking Interface Contract

All endpoints are workspace-scoped by the `tenantId` path segment and return JSON. They use server-side Firestore access; they do not grant anonymous Firestore access. Request bodies must be schema-validated and bounded. Responses must use explicit allow-lists and must not include staff, customer, or internal workspace fields.

## Access and identity

- Public catalog and availability are unauthenticated read operations.
- Client lookup, registration, and appointment creation do not require a Firebase session or email code.
- The client submits an email address; the server validates and normalizes it, then resolves it only within the workspace in the route.
- Lookup intentionally reveals whether the email matches a client record and, on a match, returns only the minimum client detail needed to continue booking.
- Email lookup does not prove that the visitor controls the email address.

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

Accepts a JSON body containing the email address to check against the tenant's normalized customer email index.

**Existing customer success `200`**

```json
{ "client": { "id": "customer-id", "name": "Client name" }, "registrationRequired": false }
```

The endpoint returns only the minimum client detail needed to continue booking.

**No matching customer `404`**

```json
{ "registrationRequired": true }
```

This response indicates that the email has no active client match in this workspace.

**Registration request**

```json
{ "email": "client@example.test", "name": "Client name", "phone": "+441234567890" }
```

The endpoint uses the validated email supplied in the body. It creates the customer and normalized-email index atomically with default communication preferences set to `unknown`. Repeated requests for the same email resolve idempotently to the same customer.

**Registration success `201`**

```json
{ "client": { "id": "customer-id", "name": "Client name" }, "registrationRequired": false }
```

**Errors**: `400` for invalid email or registration; `409` for an ambiguous/duplicate customer identity; `500` for unexpected failures.

## `POST /api/public/workspaces/{tenantId}/appointments`

Accepts a validated email and booking selection. Resolve the client from the workspace email index and revalidate all selected workspace records and slot availability during the final create transaction. Do not trust a `customerId`, price, duration, time zone, or end time from the request.

**Request**

```json
{
  "email": "client@example.test",
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

**Errors**: `400` for invalid email or selection; `404` for a workspace or client identity that cannot be resolved; `409` when the slot is no longer available; `500` for unexpected failures. A conflict response creates no appointment and allows the client to select another time.

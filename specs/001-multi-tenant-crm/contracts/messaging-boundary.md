# Messaging Integration Boundary

**Scope**: Optional WhatsApp Business Platform messaging for appointment confirmations,
reminders, and customer reactivation. This is a behavioral contract, not a vendor-specific
HTTP schema. No automated delivery is enabled until the workspace is connected to an approved
business account and its message templates are configured.

## Send Eligibility

Before creating an outbound send:

1. Resolve the workspace, customer, and optional appointment/campaign from trusted
   workspace-scoped records.
2. Verify the acting user or scheduled operation is authorized for that workspace.
3. Recheck the customer's latest communication preferences and applicable message-purpose
   permission. Marketing reactivation requires explicit marketing permission.
4. Verify the workspace has a configured sender and an approved template appropriate to the
   message purpose and provider messaging window.
5. Claim the unique send occurrence key transactionally before dispatch. A repeated request
   for the same occurrence must not create a second provider send.

If a check fails, mark the message as `suppressed` with a reason; do not send.

## Delivery and Failure Behavior

- Appointment create, update, reschedule, and cancel operations do not wait for provider
  delivery and remain successful if messaging is unavailable.
- Accepted sends are queued or scheduled separately from the user-facing appointment operation.
- A successful provider response records the provider message ID and `sent` state.
- Provider status events may advance the known state to `delivered` or `read` when available.
- A failed response or status event records a classified failure and remains visible to
  authorized workspace members or operations staff.
- Retry only transient provider failures and rate limits, with bounded backoff. Do not retry
  consent, policy, invalid-recipient, or template-approval failures without correction.
- A workspace may send only as its configured business identity. Provider credentials and
  sender identifiers must not be exposed to clients or shared across tenant records.

## Webhook/Event Handling

- Authenticate provider callbacks according to the configured provider's verification
  mechanism before processing them.
- Resolve the callback to the correct workspace through trusted provider account/sender
  configuration, not a caller-supplied tenant ID.
- Process each provider message ID and status idempotently; duplicate callbacks do not create
  duplicate delivery events or change unrelated tenants' records.
- Reject malformed or unknown events without mutating customer, appointment, consent, or
  campaign state.

## Observable Outcomes

Each send occurrence has one workspace-scoped record with recipient, purpose, optional
appointment/campaign, deduplication key, current state, provider reference when available,
timestamps, and classified failure or suppression reason. Never log access tokens or full
unnecessary customer content.

## Local Validation

The Firebase Emulator Suite validates workspace authorization, send-record idempotency, and
failure handling. Provider API and webhook behavior is exercised through test fixtures or a
stubbed adapter; the provider's production credentials are not used by local tests.

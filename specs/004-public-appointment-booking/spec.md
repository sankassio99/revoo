# Feature Specification: Public Appointment Booking

**Feature Branch**: Master
**Created**: 2026-10-18  
**Status**: Draft  
**Input**: Public workspace scheduling flow for selecting a professional, services, and a time; identifying or registering the client; and confirming an appointment.

## User Scenarios & Testing

### User Story 1 - Find a suitable appointment (Priority: P1)

A client visits a workspace’s public scheduling page, chooses an available professional and one or more services, and finds an available time that fits the selected services.

**Why this priority**: Finding a suitable appointment is the primary value of public scheduling.

**Independent Test**: From a public workspace page, choose a professional and services, then verify that the displayed daily schedule offers only times that can accommodate the selection.

**Acceptance Scenarios**:

1. **Given** a workspace has active professionals and bookable services, **When** a client opens its public scheduling page, **Then** the page lists those professionals and services.
2. **Given** a client selects a professional and one or more services, **When** the client views a date’s schedule, **Then** available times reflect the professional’s working hours, existing appointments, and the total duration of the selected services.
3. **Given** no time is available for the selected date and choices, **When** the client views the schedule, **Then** the page clearly indicates that no times are available and allows the client to choose another date or change their selections.

### User Story 2 - Identify or register as a client (Priority: P1)

A client provides an email address to continue. An existing client verifies access to their account; a new client completes registration. In either case, their selected professional, services, and time remain selected.

**Why this priority**: The workspace needs to associate the appointment with the right client without exposing private account information.

**Independent Test**: Exercise both existing-client and new-client paths and confirm that successful identification or registration proceeds with the prior booking selections intact.

**Acceptance Scenarios**:

1. **Given** a client enters an email address associated with an existing account, **When** the client completes the required identity check, **Then** the client can continue booking without re-entering their selections.
2. **Given** a client enters an email address not associated with an account, **When** the client completes the registration form successfully, **Then** the client continues booking with their selections intact.
3. **Given** the identity check or registration fails, **When** the client returns to the booking flow, **Then** the page explains the issue and preserves the selections where possible.

### User Story 3 - Confirm an appointment (Priority: P1)

A client submits the booking for their selected time. The system checks availability again, creates the appointment if the time remains available, and displays a confirmation.

**Why this priority**: A booking must not be confirmed unless the selected time can still be reserved.

**Independent Test**: Submit a booking for an available time and verify that it is confirmed once; then simulate that the time became unavailable before submission and verify that no conflicting appointment is created.

**Acceptance Scenarios**:

1. **Given** the selected time remains available, **When** the client confirms the booking, **Then** one appointment is created and a confirmation displays the workspace, professional, services, date, time, and relevant service details.
2. **Given** another booking makes the selected time unavailable before confirmation, **When** the client submits, **Then** no conflicting appointment is created and the client is prompted to choose another available time.
3. **Given** the booking is confirmed, **When** the client views the confirmation, **Then** the appointment details match the selected professional, services, and time.

### Edge Cases

- The workspace has no active professionals, no bookable services, or no available times for the selected date.
- A professional or service becomes unavailable after the client makes a selection.
- The selected services’ combined duration no longer fits in the selected slot.
- A time becomes unavailable between schedule display and booking submission.
- The client enters an invalid email address or cannot complete the identity check or registration.
- The selected date is in the past, or a daylight-saving-time change affects the displayed schedule.
- The workspace’s public page is unavailable or does not identify a valid workspace.

## Requirements

### Functional Requirements

- **FR-001**: The public scheduling page MUST show the workspace’s active professionals and bookable services.
- **FR-002**: Clients MUST be able to choose a professional and one or more services before selecting an appointment time.
- **FR-003**: The page MUST show available times for a selected professional and date, accounting for working hours, existing appointments, and the duration of the selected services.
- **FR-004**: The page MUST identify the workspace time zone when displaying dates and times.
- **FR-005**: Clients MUST provide a valid email address to continue to client identification.
- **FR-006**: The experience MUST distinguish existing-client and new-client paths without revealing account details to an unverified visitor.
- **FR-007**: Before displaying existing-client account information or associating an appointment with that account, the experience MUST verify the client’s control of the email address.
- **FR-008**: New clients MUST be able to complete registration before proceeding to booking.
- **FR-009**: Successful identification or registration MUST preserve the selected professional, services, date, and time.
- **FR-010**: Before creating an appointment, the system MUST check that the selected time remains available.
- **FR-011**: A booking for a time that is no longer available MUST NOT create a conflicting appointment; the client MUST be prompted to select another time.
- **FR-012**: A successful booking MUST create one appointment associated with the correct workspace, professional, services, and client.
- **FR-013**: After successful booking, the page MUST display confirmation details for the appointment.
- **FR-014**: When no suitable times are available or a selection becomes invalid, the page MUST explain the situation and offer a relevant next step.
- **FR-015**: Only active professionals and currently bookable services MUST be offered for new appointments.

### Key Entities

- **Workspace**: The business whose public page, time zone, professionals, and services govern booking.
- **Professional**: A workspace team member whose active status and working schedule determine appointment availability.
- **Service**: A bookable offering with a duration and other client-facing details.
- **Client**: A person identified by email, who may need to register before booking.
- **Appointment**: A confirmed reservation connecting a workspace, client, professional, services, and time.

## Success Criteria

### Measurable Outcomes

- **SC-001**: At least 90% of usability-test participants can complete a booking with an existing client account in under 3 minutes when a suitable time is available.
- **SC-002**: At least 90% of usability-test participants can register as a new client and complete a booking in under 5 minutes when a suitable time is available.
- **SC-003**: 100% of confirmed bookings correspond to a time that remained available at the final booking check.
- **SC-004**: 100% of booking attempts that lose their selected time before confirmation receive a clear notice and do not create a conflicting appointment.
- **SC-005**: At least 90% of participants can correctly identify the professional, services, date, and time in their booking confirmation.

## Assumptions

- The public page is associated with one workspace and follows that workspace’s configured time zone and booking rules.
- Multiple services may be selected; the appointment duration is based on their combined duration.
- Email ownership must be verified before a booking is associated with an existing client account or private client details are shown.
- New-client registration collects the information necessary to create a client record; additional profile fields are not specified here.
- Appointment cancellation, rescheduling, payment, and outbound confirmation messages are outside this feature’s scope.

## Checklist Results

For this draft, the 16 requested quality-checklist criteria pass: it has no unresolved clarification markers, includes testable requirements, measurable outcomes, primary user flows, edge cases, boundaries, and assumptions. The checklist file itself was **not created**.

**Readiness**: The draft is suitable for `/speckit-plan`; the feature directory, spec, and checklist still need to be written by an agent with file-editing access.
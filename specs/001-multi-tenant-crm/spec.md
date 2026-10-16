# Feature Specification: Multi-Tenant CRM for Service Businesses

**Feature Branch**: Not created (no branch hook configured)

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: Create the product specification from `requirements.md`, covering the CRM MVP for barbershops and beauty clinics.

## Clarifications

### Session 2026-10-16

- Q: Which actions should staff be allowed to perform, compared with workspace owners? → A: Staff can manage customers and appointments; only owners can manage services, professionals, workspace settings, and invitations.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Up a Secure Business Workspace (Priority: P1)

A business owner creates an account and workspace, configures the business profile, and invites staff. Staff manage customer and appointment records, while owners also manage services, professionals, workspace settings, and invitations. A person who belongs to more than one business can work in each workspace without mixing their records.

**Why this priority**: Secure workspace setup is the foundation for storing customer and appointment data for multiple businesses.

**Independent Test**: Create two workspaces and users with different memberships, then verify that each user can use their authorized workspace and cannot read or change the other workspace's data, including by requesting a record directly.

**Acceptance Scenarios**:

1. **Given** a new business owner with no workspace, **When** they create a business workspace, **Then** the workspace has a unique identity and its creator is assigned as its owner without leaving a partially configured workspace.
2. **Given** an owner in a workspace, **When** they invite a staff member, **Then** the staff member can access the workspace after joining with staff permissions.
3. **Given** a user belongs to Workspace A but not Workspace B, **When** they attempt to view or change a Workspace B record through any entry point, **Then** access is denied.
4. **Given** a user belongs to two workspaces, **When** they switch workspaces, **Then** all records, settings, and dashboard results shown belong only to the selected workspace.
5. **Given** an unauthenticated user, **When** they try to access a private business area, **Then** access is denied and the user is directed to authenticate.

---

### User Story 2 - Manage Customers, Services, Professionals, and Appointments (Priority: P1)

An owner or authorized staff member maintains customer records and uses them to book and manage appointments. Owners maintain service and professional records. The business can review its daily or weekly calendar, avoid double-booking a professional, and preserve the terms and history of each appointment.

**Why this priority**: Customer and appointment management is the core day-to-day value of the CRM.

**Independent Test**: In one workspace, create a customer, service, and professional; book and update appointments; verify calendar, appointment history, pricing snapshots, and conflict prevention.

**Acceptance Scenarios**:

1. **Given** an authorized workspace member, **When** they create, edit, archive, search for, or view a customer's appointment history, **Then** the customer record and history are available only within that workspace.
2. **Given** an owner, **When** they create or edit a service or professional and associate eligible services with a professional, **Then** the changes apply to future appointment booking choices.
3. **Given** an active professional and an available time within business hours, **When** an authorized member books an appointment with a customer and service, **Then** the appointment has a calculated end time based on service duration and the applicable business time zone.
4. **Given** two simultaneous attempts to book overlapping times for the same professional, **When** both attempts are submitted, **Then** no more than one conflicting appointment is accepted.
5. **Given** a service's price or duration changes after an appointment was booked, **When** a member views the earlier appointment, **Then** it retains the service name, duration, and price that applied when it was booked.
6. **Given** an inactive professional, **When** a member creates a new appointment, **Then** that professional cannot be selected.
7. **Given** an appointment, **When** a member reschedules, cancels, confirms, completes, or marks it as a no-show, **Then** its status and relevant change history are updated, and the amount actually charged can be recorded.
8. **Given** an appointment, **When** the member views the business's daily or weekly calendar, **Then** the appointment appears at the correct local date and time.

---

### User Story 3 - Monitor Business Activity and Retain Customers (Priority: P2)

A business owner or staff member reviews daily activity and completed-appointment revenue, identifies customers due for follow-up, and starts appropriate confirmation, reminder, or reactivation conversations without sending disallowed or duplicate marketing messages.

**Why this priority**: A workspace becomes more useful when it helps staff act on current business activity and maintain customer relationships.

**Independent Test**: Populate a workspace with appointments, revenue, and customers with different communication preferences; verify dashboard totals and follow-up eligibility, then exercise manual and configured messaging paths.

**Acceptance Scenarios**:

1. **Given** appointments in the selected workspace, **When** a member opens the dashboard, **Then** it shows that day's appointments, appointment counts by status, and revenue from completed appointments for that workspace only.
2. **Given** a customer has not returned within the workspace's configured interval, **When** a member views follow-up customers, **Then** the customer is listed with a way to open their profile and start a reactivation conversation.
3. **Given** a customer has not authorized marketing, **When** a marketing or reactivation campaign is prepared, **Then** the customer is excluded from that campaign.
4. **Given** a customer has already received a message for the same campaign, **When** that campaign is evaluated again, **Then** the customer is not sent a duplicate message for that campaign.
5. **Given** a member needs to contact a customer, **When** they choose the manual messaging option, **Then** a conversation can be opened with an appropriate prefilled message.
6. **Given** automated messaging is configured, **When** a confirmation or reminder is due, **Then** it is sent according to workspace preferences and applicable consent; its delivery state is recorded when available from the provider.
7. **Given** the messaging service is unavailable, **When** a member creates, updates, or cancels an appointment, **Then** the CRM operation remains available and the messaging failure can be observed.

---

### User Story 4 - Configure Business Operations (Priority: P2)

An owner configures the business contact details, currency, time zone, operating hours, communication intervals, services, and professionals so that the workspace reflects how the business operates.

**Why this priority**: Accurate business settings are necessary for reliable scheduling, reporting, and communications.

**Independent Test**: Configure workspace details and operating hours, then verify that appointment scheduling, calendar display, follow-up timing, and all settings remain scoped to that workspace.

**Acceptance Scenarios**:

1. **Given** an owner in a workspace, **When** they update business details, currency, time zone, operating hours, or communication intervals, **Then** the new values are saved for that workspace only.
2. **Given** configured operating hours, **When** a member attempts to book outside those hours, **Then** the appointment is not accepted.
3. **Given** a staff member, **When** they attempt to manage a service, professional, workspace setting, or invitation, **Then** the action is denied.

### Edge Cases

- A user changes a record identifier or direct link to reference a different workspace; access remains denied unless they are an authorized member of that workspace.
- A workspace-creation or owner-assignment step fails; no incomplete workspace is exposed as successfully created.
- Two appointment requests overlap only partially, use different service durations, or cross a local date boundary; conflicts are evaluated using the full appointment interval in the business time zone.
- An appointment is scheduled during a daylight-saving clock change; its local display and conflict evaluation remain unambiguous.
- A business changes a service or deactivates a professional after appointments have already been booked; existing appointment history remains intact, while inactive professionals are unavailable for new bookings.
- A customer has no optional email address, is a possible duplicate, or has incomplete contact information; customer records can still be managed without exposing another workspace's matching data.
- A customer opts out after being placed on a follow-up list; they are removed from marketing eligibility before campaign delivery.
- A messaging provider fails, supplies no delivery status, or returns a failure; appointment management remains usable and the available delivery status is represented accurately.
- A workspace changes its time zone or operating hours; existing appointments retain their recorded history, and future scheduling follows the current workspace settings.
- A user has no workspace membership, a revoked invitation, or a role without permission for the requested operation; access is denied.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a business owner to create an account and a business workspace with a unique workspace identity.
- **FR-002**: The system MUST associate the workspace creator with the workspace as its owner as part of successful workspace creation; it MUST NOT report success if the workspace is left without its owner association.
- **FR-003**: The system MUST support user registration, sign-in, sign-out, and password recovery.
- **FR-004**: The system MUST support a user belonging to one or more workspaces and switching the active workspace.
- **FR-005**: The system MUST support owner and staff roles and authorize workspace actions according to membership and role. Staff MUST be able to manage customer and appointment records; only owners MUST be able to manage services, professionals, workspace settings, and invitations.
- **FR-006**: The system MUST deny access to private areas for unauthenticated users and MUST deny any workspace data access by users lacking the necessary membership and permission. Authorization MUST be enforced for direct data requests, not solely through interface visibility.
- **FR-007**: The system MUST keep each workspace's customers, services, professionals, appointments, settings, dashboard results, and communication records isolated from other workspaces.
- **FR-008**: The system MUST allow authorized members to create, view, edit, and archive customer records containing a name, phone number, optional email, notes, and communication preferences.
- **FR-009**: The system MUST allow authorized members to search customers by name or phone number, view a customer's appointment history, and identify possible duplicate customers within the active workspace.
- **FR-010**: The system MUST allow authorized members to create, edit, and deactivate services and define each service's name, duration, and price.
- **FR-011**: The system MUST allow authorized members to create, edit, and deactivate professionals, associate them with a workspace, and define which services they can perform.
- **FR-012**: The system MUST prevent inactive professionals from being selected for new appointments.
- **FR-013**: The system MUST allow authorized members to create appointments associated with a workspace customer, service, professional, date, and time.
- **FR-014**: The system MUST calculate appointment end time from the service duration and apply the workspace's operating hours and time zone.
- **FR-015**: The system MUST prevent overlapping appointments for the same professional, including when conflicting appointment requests are submitted concurrently.
- **FR-016**: The system MUST provide daily and weekly appointment calendar views and allow authorized members to reschedule and cancel appointments.
- **FR-017**: The system MUST support appointment statuses Scheduled, Confirmed, Completed, Cancelled, and NoShow.
- **FR-018**: The system MUST preserve the service name, duration, and price that applied when an appointment was booked, even if that service is later changed.
- **FR-019**: The system MUST allow authorized members to record the amount actually charged and MUST preserve relevant appointment change history.
- **FR-020**: The system MUST show workspace-scoped dashboard information including the day's appointments, appointment counts by status, revenue from completed appointments, and customers due for follow-up.
- **FR-021**: The system MUST allow owners to configure business name and contact details, currency, time zone, operating hours, and reminder or reactivation intervals separately for each workspace.
- **FR-022**: The system MUST support opening a customer conversation with an appropriate prefilled message.
- **FR-023**: The system MUST support automated confirmation and reminder delivery when an approved messaging integration has been configured and MUST record delivery state when the provider makes it available.
- **FR-024**: Messaging failure MUST NOT prevent a member from managing appointments; messaging outcomes and automated-operation failures MUST be observable.
- **FR-025**: The system MUST identify customers who have not returned within the workspace's configured follow-up interval and allow authorized members to start a reactivation conversation.
- **FR-026**: The system MUST honor customer communication preferences and applicable legal requirements; customers who have not authorized marketing MUST be excluded from marketing reactivation campaigns.
- **FR-027**: The system MUST prevent repeat delivery to the same customer for the same campaign.
- **FR-028**: The system MUST minimize personal data, restrict access to authorized users, and provide appropriate data retention and deletion.
- **FR-029**: The product MUST support multiple businesses within the shared service without requiring a separate product instance for each business.
- **FR-030**: The product MUST define and test a data backup and recovery procedure.
- **FR-031**: The product MUST provide a reproducible local development and test environment, including documented setup and operation.

### Key Entities

- **User**: An authenticated person with identity and membership in one or more workspaces.
- **Workspace**: A business account with a unique identity, business profile, operating settings, and its own records.
- **Membership**: A user's association with a workspace, including their role and invitation state.
- **Customer**: A workspace-owned contact with identity, contact details, notes, preferences, and appointment history.
- **Service**: A workspace offering with a name, duration, price, and eligible professionals.
- **Professional**: A workspace team member or service provider with active status and eligible services.
- **Appointment**: A scheduled customer service with a professional, time interval, status, booking-time service details, amount charged, and change history.
- **Communication Preference**: A customer's permission and preferences for relevant message types.
- **Message Campaign**: A workspace-scoped set of customer communications with eligibility, interval, and duplicate-delivery controls.
- **Message Record**: An attempted or delivered communication and its provider-reported status when available.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In the complete authorization test set, 100% of attempts by users without workspace membership to read or change that workspace's records are denied, including direct-record access.
- **SC-002**: In representative performance tests, at least 95% of common customer searches, calendar views, and dashboard views complete in under 300 ms.
- **SC-003**: For every tested set of simultaneous overlapping booking attempts for one professional, no more than one conflicting appointment is accepted.
- **SC-004**: At least 90% of representative first-time owners complete workspace setup, add a service, and invite a staff member without assistance.
- **SC-005**: Dashboard appointment counts, completed-appointment revenue, and follow-up lists match the underlying records for the selected workspace, with no records from other workspaces.
- **SC-006**: In campaign tests, 100% of customers without marketing authorization are excluded and no customer receives the same campaign more than once.
- **SC-007**: During messaging-service outage tests, users can still create, update, and cancel appointments; all tested messaging failures are visible in the communication status or operational error record.
- **SC-008**: The documented backup can be restored successfully in a recovery exercise, with recovered workspace records remaining isolated.

## Assumptions

- The product serves independent barbershops and beauty or aesthetics clinics through the same service; each business is represented by a separate workspace.
- MVP scope includes workspace onboarding, customer and service records, staff and professional management, appointment scheduling, the business dashboard, follow-up, and optional messaging. Native mobile applications, customer self-service booking, built-in payment processing, and required push notifications are outside this MVP.
- The workspace creator is its initial owner. Owners administer workspace membership and settings; staff receive only the permissions assigned to their role. Detailed per-action role permissions will be defined during planning without weakening the isolation requirements.
- The owner supplies the business's currency, time zone, operating hours, and communication intervals; no universal default is assumed for these business-specific values.
- Customer matching identifies possible duplicates for human review and does not automatically merge customer records.
- Communication eligibility is evaluated at delivery time against the latest recorded preference. Applicable law and the message purpose determine whether a message requires consent.
- Automated messaging is optional and depends on a separately configured, approved provider integration. Manual conversation links remain available independently.
- Push notifications are not required for this MVP.
- The performance target is evaluated under documented, representative test conditions; actual results depend on workload and operating conditions.
- The 90% first-time owner completion target is a proposed usability benchmark for validation, not an existing measured baseline.
- The source requirements select the product's technical stack and local environment. Those implementation constraints are retained in `requirements.md` and are inputs to planning, not user-facing functional requirements in this specification.

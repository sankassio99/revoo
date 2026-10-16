<!--
Sync Impact Report
Version change: unversioned template → 1.0.0
Modified principles: none; the five principle slots were previously unpopulated and are established below.
Added sections: Security and Product Constraints; Engineering and Release Quality Gates.
Removed sections: none.
Follow-up TODOs: confirm the original ratification date.
-->
# Revoo CRM Constitution

## Core Principles

### I. Tenant Isolation and Least Privilege
Every data access MUST verify the authenticated user's membership in the requested tenant and
their role's permissions. Firestore Security Rules MUST deny access by default and enforce this
authorization independently of frontend checks. Operations using the Admin SDK MUST perform
equivalent explicit authorization because Security Rules do not protect those operations. Tests
MUST prove that a user in one tenant cannot read or change another tenant's data, including by
changing document IDs, URLs, or direct requests. Tenant creation and owner assignment MUST leave
no partially configured tenant.

### II. Privacy and Communication Consent
The system MUST collect and retain only personal data needed for CRM functions, restrict access
to authorized users, and support appropriate retention and deletion. Marketing and reactivation
messages MUST respect recorded communication preferences and applicable legal requirements.
Customers who have not authorized marketing MUST be excluded from marketing campaigns, and
campaign logic MUST prevent repeated messages to the same customer. This protects customer
trust and reduces unnecessary exposure of personal data.

### III. Reliable Business Invariants
Business rules MUST preserve correct appointment, customer, and financial records across
concurrent operations and later edits. The system MUST prevent conflicting appointments for the
same professional, calculate end times from service duration, and apply the business's hours
and time zone. Appointment records MUST preserve the service name, duration, and price applicable
when booked, as well as relevant change history and the amount actually charged. Concurrency
controls and tests MUST demonstrate that competing requests cannot claim the same time slot.

### IV. Verifiable Quality and Operations
Business logic and authorization rules MUST be testable. Changes affecting data access or tenant
boundaries MUST include authorization and isolation tests covering at least two tenants; other
changes MUST include relevant unit or integration tests. Local development and tests MUST be
reproducible with Docker Compose and the Firebase Emulator Suite. Common-query performance MUST
be measured under representative test conditions against the p95 target of less than 300 ms.
Operational errors, failed automated operations, and relevant metrics MUST be observable.
Firestore backup and recovery procedures MUST be defined and tested.

### V. Resilient, Focused Architecture
The product MUST use Next.js with TypeScript and Firebase Authentication and Cloud Firestore as
its primary application data services. Operational records and tenant configuration MUST remain
scoped to the owning tenant, and personal data MUST NOT be duplicated without a clear need.
Cloud Functions MAY be used for privileged or scheduled work, with explicit authorization;
Firebase Cloud Messaging is optional and MUST NOT be treated as a substitute for WhatsApp
Business integration. Failure of messaging providers MUST NOT block core CRM or appointment
management. Implementations MUST favor the simplest design that satisfies these requirements.

## Security and Product Constraints

- Workspaces MUST have unique tenant identifiers, and users MAY belong to multiple tenants with
  role-based permissions such as Owner and Staff.
- Firestore MUST be the primary data store. Tenant-scoped records include customers, services,
  professionals, appointments, settings, and message logs.
- Firebase Authentication MUST provide user identity. Administrative authentication and data
  operations MUST be limited to explicitly authorized privileged operations.
- Service changes MUST NOT rewrite the service details already applied to existing appointments.
  Inactive professionals MUST NOT receive new appointments.
- WhatsApp links with prefilled messages MAY be used without automated delivery. Automated
  sending requires a configured WhatsApp Business Platform integration; delivery status is
  recorded when the provider supplies it.
- The local environment MUST use Firebase emulators, keep development credentials separate from
  production credentials, and document how to start and test the environment.

## Engineering and Release Quality Gates

- Changes MUST be reviewed for tenant authorization, privacy impact, and consistency with the
  business invariants in this constitution.
- Tests MUST exercise Firebase Security Rules and relevant integration behavior through the
  Emulator Suite; frontend-only checks do not satisfy authorization requirements.
- Performance claims MUST be supported by representative measurements. The p95 target is a
  verification objective, not an assumed guarantee independent of workload, indexes, region, or
  network.
- Releases MUST NOT proceed with known cross-tenant access failures or untested recovery
  procedures. Deployment readiness MUST include the relevant tests and operational checks.
- Messaging integrations MUST fail independently of core CRM workflows and surface delivery
  failures through observable status or error reporting.

## Governance

This constitution governs product and engineering decisions for the Revoo CRM. When another
project document conflicts with it, the conflict MUST be resolved by amending this constitution
or bringing that document into compliance; implementation plans and code MUST NOT silently
override its requirements.

Amendments MUST document their rationale and impact, be reviewed and approved by project
maintainers, and update the version and amendment date. Changes that remove or redefine a
principle or otherwise break existing governance require a MAJOR version increment. New
principles or materially expanded requirements require a MINOR increment. Clarifications and
non-semantic refinements require a PATCH increment. Compliance MUST be reviewed during feature
planning, code review, and release readiness. Any justified exception MUST be documented,
scoped, approved by maintainers, and accompanied by a mitigation where a requirement cannot be
met.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Original adoption date is not recorded; confirm from project history. | **Last Amended**: 2026-10-16

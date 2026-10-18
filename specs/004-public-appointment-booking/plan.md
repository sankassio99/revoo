# Implementation Plan: Public Appointment Booking

**Branch**: `master` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-public-appointment-booking/spec.md`

## Summary

Add a public workspace booking journey to select a professional, services, and an available time, identify the client by checking a provided email against workspace records, and create and confirm an appointment. Reuse the existing workspace-scoped appointment records, time-zone conversion, catalog records, and schedule-guard transaction pattern. Public endpoints must expose only booking-safe workspace data and must never use the existing staff-only endpoints as a public access path.

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16, React 19; Node.js 22-24  
**Primary Dependencies**: Next.js App Router, Firebase Authentication, Firebase Admin SDK, Cloud Firestore, Zod  
**Storage**: Cloud Firestore; existing `tenants/{tenantId}` collections for settings, services, professionals, customers, appointments, and schedule guards  
**Testing**: Vitest unit/integration tests with Firebase Emulator Suite; Playwright for booking journey coverage  
**Target Platform**: Responsive public web application  
**Project Type**: Multi-tenant web application  
**Performance Goals**: Public catalog and availability views should be usable within 2 seconds under normal emulator/production-like conditions; follow the constitution's p95-under-300ms target for representative common data queries, measured separately from network and rendering time  
**Constraints**: All reads and writes remain tenant-scoped; only explicitly public fields may be returned; email lookup requires no code or authenticated session; appointment creation must revalidate service, professional, workspace hours, and interval conflicts in the same transaction as persistence; workspace time zone governs displayed and stored booking times  
**Scale/Scope**: One public booking journey per workspace; multiple services may be selected; support existing and new client records; no payments, cancellations, rescheduling, or automated confirmation messages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| Tenant isolation and least privilege | Every public request is bound to one validated workspace ID; server-side reads select only booking fields; appointment writes resolve the client by email within that workspace and cannot cross workspace boundaries. | PASS with design guardrails below |
| Privacy and communication consent | Email lookup intentionally reveals whether an email matches a client record and the minimum client name needed to proceed; do not return customer details from catalog or availability operations; collect only details needed for registration and booking. | PASS |
| Reliable business invariants | Recalculate duration, price snapshot, workspace hours, and availability at submission; serialize competing reservations using the existing schedule guard and transaction pattern. | PASS |
| Verifiable quality and operations | Add unit, emulator integration, and public-flow tests including tenant isolation, email lookup, double booking, and confirmation contents. | PASS |
| Resilient, focused architecture | Use existing Next.js and Firestore services; keep privileged Firestore operations server-side and reuse existing appointment/time helpers where possible. | PASS |

**Pre-design gate**: PASS. The implementation uses existing platform services and requires no constitutional exception. Public server routes must not weaken Firestore Security Rules or reuse staff endpoints without their membership authorization.

## Project Structure

### Documentation (this feature)

```text
specs/004-public-appointment-booking/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── public-booking.md
└── tasks.md                 # Phase 2 output; not created by planning
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── book/[tenantId]/page.tsx
│   └── api/public/workspaces/[tenantId]/
│       ├── booking-options/route.ts
│       ├── availability/route.ts
│       ├── client/route.ts
│       └── appointments/route.ts
├── features/
│   ├── public-booking/
│   │   ├── public-booking.schema.ts
│   │   ├── public-booking.service.ts
│   │   └── client-booking-flow.tsx
│   └── appointments/
│       └── appointment.service.ts  # extend/reuse guarded creation logic
└── lib/
    └── domain/time.ts              # existing local-time conversion helpers

tests/
├── integration/
│   └── public-booking.test.ts
├── e2e/
│   └── public-booking.spec.ts
└── domain/
    └── public-booking.test.ts
```

**Structure Decision**: This is an addition to the existing single Next.js application. Public routes and the page are separate from staff workspace routes. Business validation and privileged Firestore operations live in a server-only booking feature service; the existing appointment service's staff workflow remains protected by membership authorization.

## Phase 0: Research

See [research.md](./research.md). Decisions use the repository's current Firebase, Firestore, appointment, and time-zone patterns; no new external service is assumed.

## Phase 1: Design & Contracts

- [Data model](./data-model.md) defines the public booking view, request email identity, customer record, and appointment snapshots.
- [Public booking contract](./contracts/public-booking.md) defines safe public reads and email-matched client writes.
- [Quickstart](./quickstart.md) lists emulator, test, and end-to-end verification steps.

### Post-design Constitution Check

| Principle | Design verification | Status |
|---|---|---|
| Tenant isolation and least privilege | Every service receives a validated tenant ID; public response mappers return allow-listed fields; client lookup and appointment mutations are restricted to that tenant; emulator tests attempt cross-tenant access. | PASS |
| Privacy and communication consent | Email lookup intentionally reveals whether an address matches a customer and returns the minimum name needed to continue; registration collects only details needed for booking. | PASS |
| Reliable business invariants | The final booking operation rereads current records and checks the schedule guard, working hours, and conflicts within the transaction; appointment service details are snapshotted. | PASS |
| Verifiable quality and operations | Planned unit, emulator integration, and Playwright flows cover normal booking, registration, stale slots, invalid input, and authorization failures. | PASS |
| Resilient, focused architecture | Design adds no separate backend, store, or provider; shared time and schedule logic remains the source of booking invariants. | PASS |

**Final gate**: PASS. No constitution violations or complexity exceptions are required.

## Complexity Tracking

No constitution violations.

# Implementation Plan: Portuguese and English Language Support

**Branch**: `master` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-i18n-language-support/spec.md`

## Summary

Provide Portuguese and English throughout the existing Revoo interface. Resolve the initial language from a prior explicit browser choice or, when absent, the browser's preferred language with English as the fallback. A single application-wide preference must serve both server-rendered pages and interactive controls; use a non-sensitive browser cookie readable by the server, seed a shared client provider from the same request locale, and refresh server-rendered content when the user changes language. Keep the preference separate from workspace data.

## Technical Context

**Language/Version**: TypeScript 5.9; Node.js 22-24; React 19

**Primary Dependencies**: Next.js 16 App Router and React 19 already in use; no additional internationalization runtime dependency is planned.

**Storage**: A same-site browser language-preference cookie for explicit choices; no Firestore, workspace, or account preference record.

**Testing**: Vitest for pure locale, message-catalog, and formatting behavior; selection, persistence, and cross-page behavior; existing TypeScript and ESLint checks.

**Target Platform**: Responsive web application, current supported desktop and mobile browsers.

**Project Type**: Next.js web application with server-rendered routes, client-side interactive forms, and existing Firebase-backed workspace features.

**Performance Goals**: Language resolution adds no external request. A user selection updates interactive controls immediately and server-rendered page text on the next route refresh/navigation. No unmeasured numeric latency claim is introduced.

**Constraints**: Support only Portuguese (`pt`) and English (`en`); map supported regional browser tags to the base language and use English for unsupported or unavailable preferences. Explicit user choice takes precedence. Localize product-provided UI and system feedback without translating user/business content or changing business values, currency, or time zone. Validate cookie values against the supported-language allowlist.

**Scale/Scope**: Cover existing user-facing public, authentication, workspace, and settings screens; accessible labels and system feedback; both home and Settings selection points; and locale-aware presentation of displayed dates and numbers.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / constraint | Gate | Rationale |
|---|---|---|
| I. Tenant isolation and least privilege | PASS | Language is a browser-level presentation preference, not tenant data. No workspace reads, writes, permissions, or Firebase authorization rules change. |
| II. Privacy and communication consent | PASS | The preference contains no personal or customer data and is not sent to a third-party service or messaging provider. |
| III. Reliable business invariants | PASS | Formatting uses the active locale while preserving business values, configured currency, and time zone; no booking, service, or financial invariant changes. |
| IV. Verifiable quality and operations | PASS | Add focused unit coverage and run the existing typecheck and lint. Browser tests are excluded by the feature constraints. No database or Security Rules behavior changes. |
| V. Resilient, focused architecture | PASS | Keep the existing Next.js, TypeScript, and Firebase architecture; add no dependency or persistent tenant data without need. |

**Pre-research gate**: PASS. No constitutional conflict or unresolved technical requirement blocks design.

## Project Structure

### Documentation (this feature)

```text
specs/003-i18n-language-support/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── language-preference.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                         # Resolve request locale, document language, shared provider
│   ├── page.tsx                            # Localized public home and language control
│   ├── login/                              # Localized authentication screens and feedback
│   ├── recover/
│   └── (workspace)/                        # Localized workspace and Settings screens
├── features/
│   ├── i18n/                                # Shared provider and reusable language selector
│   ├── auth/                                # Localized interactive authentication feedback
│   ├── navigation/                          # Localized navigation labels and accessible names
│   ├── appointments/                        # Localized interactive appointment UI
│   ├── catalog/                             # Localized catalog UI
│   ├── customers/                           # Localized customer UI
│   └── workspaces/                          # Localized Settings and team UI
└── lib/
    └── i18n/                                # Supported-locale types, request resolution, message catalogs, formatting

tests/
├── domain/                                  # Locale negotiation, messages, and formatting unit tests
└── e2e/
    └── language-preference.spec.ts          # Defaulting, control, persistence, and page consistency
```

**Structure Decision**: Use the existing single Next.js application and its `src/app`, `src/features`, `src/lib`, and `tests` organization. Keep pure locale resolution and translation/formatting support in `src/lib/i18n`; keep interactive provider and selector UI in `src/features/i18n`. All server-rendered pages must use the request-resolved locale, while client components use the root provider initialized with that same locale.

## Constitution Check (Post-Design)

| Principle / constraint | Gate | Design verification |
|---|---|---|
| I. Tenant isolation and least privilege | PASS | Preference is stored only in the visitor's browser and is not used for authorization or tenant selection. |
| II. Privacy and communication consent | PASS | Only one allowlisted language code is stored; no customer information or communication preference is involved. |
| III. Reliable business invariants | PASS | Locale affects presentation only; amount, currency, time-zone configuration, and persisted business records remain unchanged. |
| IV. Verifiable quality and operations | PASS | Unit tests cover locale resolution, catalog parity, interpolation, and formatting; typecheck and lint cover integration quality. Browser tests are excluded by the feature constraints. |
| V. Resilient, focused architecture | PASS | Existing platform and storage boundaries are preserved; no new runtime package, API, or Firebase document is required. |

**Post-design gate**: PASS. No violations require complexity tracking or an exception.

## Complexity Tracking

No constitution violations or complexity exceptions.
No browser tests or Playwright runs are in scope for this feature.

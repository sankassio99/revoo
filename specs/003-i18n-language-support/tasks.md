# Tasks: Portuguese and English Language Support

**Input**: Design documents from `specs/003-i18n-language-support/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/language-preference.md`, `quickstart.md`

**Tests**: Include focused unit, type, and lint validation tasks. Browser tests and Playwright are excluded by the feature constraints.

**Organization**: Tasks are grouped by the three prioritized user stories in `spec.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Tasks can run in parallel because they modify different files and have no incomplete dependencies.
- **[Story]**: The user story served by a task; setup and foundational tasks have no story label.
- Every task names the exact file path(s) to create or change.

## Phase 1: Setup

**Purpose**: Establish deterministic locale rules and the message-catalog contract used throughout the feature.

- [X] T001 [P] Add Vitest coverage for explicit preference precedence, `pt`/`en` regional browser tags, unsupported and missing preferences, and invalid saved values in `tests/domain/i18n.test.ts`.
- [X] T002 [P] Define the English and Portuguese semantic message catalogs and compile-time key parity in `src/lib/i18n/messages.ts`.
- [X] T003 Implement the `Locale` type, supported-locale guard, browser language-tag normalization, and locale resolver in `src/lib/i18n/locale.ts`; accept only `pt` and `en`, map supported regional tags to their base locale, prefer valid explicit choices, and fall back to `en`.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Make one request-resolved preference available to server-rendered and interactive screens before story-specific UI is built.

- [X] T004 Add request locale and explicit-preference cookie helpers in `src/lib/i18n/server.ts`; validate cookie values against `pt` and `en`, read the browser's preferred language when available, and do not persist automatically inferred choices.
- [X] T005 Add a root-level client language provider and translation access in `src/features/i18n/language-provider.tsx`; initialize it from the server-resolved locale, expose the current locale and typed message lookup, and update the document language when the active locale changes.
- [X] T006 Add an accessible reusable Portuguese/English selector in `src/features/i18n/language-selector.tsx`; expose the current choice, descriptive accessible name, and a selection callback without assuming where the selector is placed.
- [X] T007 Add shared date and number formatting helpers in `src/lib/i18n/format.ts`; format with the active locale while taking configured business time zone and currency as explicit inputs when applicable.
- [X] T008 Extend `tests/domain/i18n.test.ts` to assert catalog key parity and representative number, date, and currency formatting for both locales; verify the supplied currency and time zone remain unchanged.

**Checkpoint**: Locale resolution, server preference access, typed messages, shared client state, selector, and formatting helpers are ready for the user-story phases.

## Phase 3: User Story 1 - Start in a familiar language (Priority: P1) 🎯 MVP

**Goal**: On a first visit, render the public home page in the supported language inferred from the browser, using English when the browser language is unsupported or unavailable.

**Independent Test**: Open fresh browser contexts with `pt`, `pt-BR`, `en`, and an unsupported language preference. Verify home-page copy and `<html lang>` use Portuguese for Portuguese preferences and English for English, unsupported, or missing preferences.


### Implementation for User Story 1

- [X] T010 [P] [US1] Resolve the request locale in `src/app/layout.tsx`, set the rendered document `lang`, and wrap all routes in `LanguageProvider` initialized with that locale so the first server render and client state agree.
- [X] T011 [P] [US1] Add both-language translations for all public home-page product copy and accessible labels in `src/lib/i18n/messages.ts`.
- [X] T012 [US1] Render the public home page using server-resolved translated messages in `src/app/page.tsx` while preserving its existing layout and navigation.

**Checkpoint**: A first-time visitor sees the correct Portuguese or English home page and document language without a client-side language flash.

## Phase 4: User Story 2 - Change language from home or Settings (Priority: P1)

**Goal**: Let a visitor or signed-in user explicitly choose Portuguese or English on the home page or in Settings, and retain that choice in the same browser across reloads and routes.

**Independent Test**: Change language from the home page and from signed-in Settings in turn. Verify the selector state, document language, server-rendered content, navigation, and selection after reload remain consistent.

### Implementation for User Story 2

- [X] T015 [US2] Implement selector change handling in `src/features/i18n/language-provider.tsx`; immediately update shared client state and document language, write only the allowlisted explicit locale to a root-scoped same-site cookie, and refresh server-rendered content.
- [X] T016 [P] [US2] Add the shared language selector to the home-page main navigation and ensure the selector's current state and accessible name are localized in `src/app/page.tsx` and `src/features/i18n/language-selector.tsx`.
- [X] T017 [P] [US2] Add the same shared language selector to Settings, outside the owner-only business configuration controls, in `src/app/(workspace)/workspace/settings/page.tsx`.

**Checkpoint**: Either selector updates the same browser-wide preference, remains synchronized, and overrides browser language on subsequent requests.

## Phase 5: User Story 3 - Use the complete interface in either language (Priority: P1)

**Goal**: Localize all existing user-facing screens, system feedback, and accessible labels while leaving user/business content and business values unchanged.

**Independent Test**: Select each language and inspect all public, authentication, workspace, and Settings routes plus form errors, empty states, status messages, and keyboard/screen-reader labels. Verify displayed dates and numbers follow the locale without changing source values, configured currency, or time zone.

### Tests for User Story 3

- [X] T018 [US3] Extend `tests/domain/i18n.test.ts` to verify both catalogs contain corresponding keys for every user-facing message namespace and that missing translations fail validation.

### Implementation for User Story 3

- [X] T021 [US3] Translate the sign-in, registration, recovery, and invitation-acceptance page copy, accessible labels, and user-visible authentication feedback in both language catalogs and `src/app/login/page.tsx`, `src/app/recover/page.tsx`, `src/app/accept-invitation/page.tsx`, `src/features/auth/auth-form.tsx`, and `src/features/auth/password-recovery-form.tsx`.
- [X] T022 [US3] Translate shared workspace navigation, mobile controls, workspace switcher, and their accessible names in both catalogs and `src/features/navigation/app-frame.tsx`, `src/features/navigation/mobile-nav.tsx`, `src/features/navigation/sidebar-nav.tsx`, `src/features/navigation/navigation-items.ts`, and `src/features/workspaces/workspace-switcher.tsx`, and `src/app/(workspace)/workspace/loading.tsx`.
- [X] T023 [US3] Translate appointment pages, calendar controls, appointment form labels, validation and status feedback, and date presentation in both catalogs and `src/app/(workspace)/workspace/appointments/page.tsx`, `src/features/appointments/appointment-calendar.tsx`, `src/features/appointments/appointment-form.tsx`, `src/features/appointments/appointment.schema.ts`, and `src/features/appointments/appointment.service.ts`.
- [X] T024 [US3] Translate customer list/detail/form/archive interfaces, accessible labels, empty states, and validation feedback in both catalogs and `src/app/(workspace)/workspace/customers/page.tsx`, `src/app/(workspace)/workspace/customers/[customerId]/page.tsx`, `src/features/customers/customer-form.tsx`, `src/features/customers/customer-archive-button.tsx`, and `src/features/customers/customer.schema.ts`.
- [X] T025 [US3] Translate catalog and catalog-settings interfaces, form labels, empty states, and validation/status feedback in both catalogs and `src/app/(workspace)/workspace/settings/catalog/page.tsx`, `src/features/catalog/catalog-manager.tsx`, and `src/features/catalog/catalog.schema.ts`.
- [X] T026 [US3] Translate workspace overview, follow-up, reports, workspace creation, team/invitation, and business Settings screens, including their system feedback and accessible labels, in both catalogs and `src/app/(workspace)/workspace/page.tsx`, `src/app/(workspace)/workspace/follow-up/page.tsx`, `src/app/(workspace)/workspace/reports/page.tsx`, `src/app/(workspace)/workspace/new/page.tsx`, `src/app/(workspace)/workspace/settings/team/page.tsx`, `src/features/workspaces/new-workspace/page-content.tsx`, `src/features/workspaces/create-workspace-button.tsx`, `src/features/workspaces/create-workspace-form.tsx`, `src/features/workspaces/invitation-manager.tsx`, `src/features/workspaces/invitation-acceptance.tsx`, and `src/features/workspaces/workspace-settings-form.tsx`, `src/features/workspaces/workspace-settings.schema.ts`, and `src/features/workspaces/invitation.schema.ts`.
- [X] T027 [US3] Localize product-provided document titles and descriptions using the request locale in `src/app/layout.tsx`, `src/app/login/page.tsx`, `src/app/recover/page.tsx`, and `src/app/(workspace)/workspace/new/page.tsx` without changing route behavior.
- [X] T028 [US3] Replace locale-sensitive user-visible date and number formatting in remaining affected workspace views with shared helpers from `src/lib/i18n/format.ts`; preserve business-configured currency, time zone, and underlying values in `src/app/(workspace)/workspace/page.tsx`, `src/app/(workspace)/workspace/appointments/page.tsx`, `src/app/(workspace)/workspace/follow-up/page.tsx`, and `src/app/(workspace)/workspace/reports/page.tsx`.

**Checkpoint**: All product-provided text and system feedback across existing user-facing screens use the selected language; customer, business, and user-provided content and business settings remain unchanged.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify the integrated feature against the plan, accessibility expectations, and repository quality gates.

- [X] T029 Run `npm run test:unit` as configured in `package.json` to validate `tests/domain/i18n.test.ts` and resolve locale or formatting failures in `src/lib/i18n/locale.ts`, `src/lib/i18n/messages.ts`, and `src/lib/i18n/format.ts`.
- [X] T031 Run `npm run typecheck` and `npm run lint` as configured in `package.json`; resolve feature-caused diagnostics in the exact source and test files changed for this feature.
- [X] T032 Perform a source-level audit of translated route copy, accessibility labels, locale formatting, and preservation of business/user data; do not run browser tests or Playwright.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately; locale tests, catalogs, and resolver are independent files.
- **Foundational (Phase 2)**: Depends on Setup; server helper and provider depend on the locale and catalog contracts. Blocks user-story implementation.
- **User Story 1 (Phase 3)**: Depends on Foundation; implements browser-derived locale on the home page.
- **User Story 2 (Phase 4)**: Depends on User Story 1 because it extends the same root provider and home page to add explicit choice and persistence.
- **User Story 3 (Phase 5)**: Depends on the shared provider and selector and follows User Story 2 to avoid concurrent changes to Settings, catalogs, and shared application layout.
- **Polish (Phase 6)**: Depends on all three user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 only; it is the independently testable MVP.
- **User Story 2 (P1)**: Depends on User Story 1 because the selection controls update the locale resolver/provider and the home page.
- **User Story 3 (P1)**: Depends on User Story 2 for a complete, user-selectable localized interface. Its screen-group tasks share the same catalog and are intentionally serialized to avoid conflicting catalog edits.

### Parallel Opportunities

- T001 and T002 can proceed in parallel; T003 implements the resolver tested by T001.
- T004, T006, and T007 use separate files and can proceed in parallel after the locale type exists; T005 consumes the locale and message contracts.
- User Story 3 is intentionally serialized because T021-T026 all extend the shared message catalog in `src/lib/i18n/messages.ts`; assign one implementer to avoid conflicting catalog edits while rotating across non-overlapping screen groups.
- T027 and T028 overlap files with T021, T023, and T026 and should run only after those tasks finish or be integrated by the same implementer.
- T029-T032 are final integrated validation tasks and run after story implementation.

## Parallel Examples

```text
User Story 1: T010 (root layout) and T011 (home message catalog entries) can proceed in parallel; complete T012 after both.
User Story 2: After T015 completes, T016 (home page) and T017 (Settings page) can proceed in parallel because they touch separate files.
User Story 3: No safe parallel tasks are defined: T021-T026 all modify the shared catalog in src/lib/i18n/messages.ts. Process the separate screen groups serially, then complete T027-T032.
```
## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: locale rules and catalog foundation.
2. Complete Phase 2: request resolution and root provider.
4. Validate fresh browser defaults and document language using T009.
5. Stop at the checkpoint; the home page default is independently demonstrable.

### Incremental Delivery

1. Complete setup and foundation.
2. Deliver User Story 1 for browser-language defaults on the home page.
3. Deliver User Story 2 for explicit selection and same-browser persistence.
4. Deliver User Story 3 for full interface coverage and locale-aware formatting.
5. Complete integrated unit, type, lint, and source-level validation.

## Notes

- Every executable task has a unique sequential ID and names at least one exact file path.
- [P] marks only work that can safely modify different files without unfinished dependencies.
- Test tasks are included for unit, type, and lint verification. Browser tests and Playwright are explicitly out of scope.
- Do not change Firestore data models, Security Rules, business currency, business time zone, or user-provided content for this feature.
- Do not add or run browser tests or Playwright for this feature.

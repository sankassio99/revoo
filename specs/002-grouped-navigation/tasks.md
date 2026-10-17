# Tasks: Grouped Workspace Navigation

**Input**: Design documents from `specs/002-grouped-navigation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/navigation-ui.md, quickstart.md

**Tests**: Include focused tests because the project constitution requires relevant unit or integration tests for changes, and the implementation plan specifies Vitest and Playwright coverage.

**Organization**: Tasks are grouped by the three user stories in `spec.md`. Story 2 builds on the initial navigation from Story 1; Story 3 completes responsive/mobile and keyboard behavior.

## Phase 1: Setup

**Purpose**: Install the shadcn navigation primitive selected in research.

- [ ] T001 Add the configured shadcn Sidebar component with `npx shadcn@latest add sidebar` and verify its generated source at `src/components/ui/sidebar.tsx`.

## Phase 2: Foundational

No additional foundational code is required: the app already has shadcn configuration and an authenticated workspace shell. Complete T001 before starting the user stories.

## Phase 3: User Story 1 - Navigate all workspace areas from one menu (Priority: P1)

**Goal**: Make Overview, Appointments, Customers, Follow-up, Reports, and the Settings destination reachable from the workspace navigation; ensure direct and nested routes receive correct active state.

**Independent Test**: In an authenticated workspace, open each listed destination and verify it loads and marks only its corresponding entry current; verify a customer detail route keeps Customers active. Confirm Reports opens rather than returning a missing-page response.

### Tests for User Story 1

- [ ] T002 [P] [US1] Add route matching tests for exact Overview, nested Customers detail, and unmatched paths in `tests/domain/navigation.test.ts`.
- [ ] T003 [P] [US1] Add an authenticated Playwright test for the top-level workspace links and current-page states in `tests/e2e/workspace-navigation.spec.ts`.

### Implementation for User Story 1

- [ ] T004 [US1] Define the ordered top-level navigation entries, route labels, paths, and icons in `src/features/navigation/navigation-items.ts`.
- [ ] T005 [US1] Implement URL matching for exact workspace routes, customer descendant routes, and unmatched paths in `src/features/navigation/navigation-match.ts`.
- [ ] T006 [US1] Render the initial workspace navigation from the shared entries using shadcn Sidebar primitives in `src/features/navigation/sidebar-nav.tsx`.
- [ ] T007 [P] [US1] Add the basic authenticated Reports destination with honest introductory/empty content and no fabricated metrics in `src/app/(workspace)/workspace/reports/page.tsx`.

**Checkpoint**: All top-level destinations, including Reports, work independently; route active state is correct on direct loads and customer detail pages.

## Phase 4: User Story 2 - Reach settings pages through a group with sub-items (Priority: P1)

**Goal**: Group Business, Catalog, and Team beneath an expandable Settings entry and indicate the current child and active parent.

**Independent Test**: Expand Settings and open each child. Directly load Catalog and Team to verify Settings expands automatically and exactly the current child is marked current; collapse Settings while a child page is open and verify the parent remains active.

### Tests for User Story 2

- [ ] T008 [P] [US2] Extend route/navigation tests for Business, Catalog, Team, expanded-on-descendant, and group-active behavior in `tests/domain/navigation.test.ts`.
- [ ] T009 [P] [US2] Add an authenticated Playwright test for expanding Settings, navigating to Business/Catalog/Team, and verifying active child states in `tests/e2e/workspace-navigation.spec.ts`.

### Implementation for User Story 2

- [ ] T010 [US2] Represent Business (`/workspace/settings`), Catalog (`/workspace/settings/catalog`), and Team (`/workspace/settings/team`) as ordered children of Settings in `src/features/navigation/navigation-items.ts`.
- [ ] T011 [US2] Render Settings as an accessible expandable shadcn Sidebar group, automatically expand it for a current child, and keep it active while a child is current in `src/features/navigation/sidebar-nav.tsx`.
- [ ] T012 [US2] Refine route resolution so each Settings child matches only its own route and the Settings group is active for any child route in `src/features/navigation/navigation-match.ts`.

**Checkpoint**: Business, Catalog, and Team are reachable as Settings children; direct navigation, active state, and expansion behave as specified.

## Phase 5: User Story 3 - Use the same menu on mobile and with a keyboard (Priority: P2)

**Goal**: Present the same grouped navigation on small and large screens, with accessible keyboard interaction and mobile close-on-navigation behavior.

**Independent Test**: At 320px/mobile width, open navigation, expand Settings, choose Catalog, and verify it navigates and closes. Using keyboard only, reach and operate every destination and group disclosure, with visible focus and announced expanded state. Repeat at desktop width.

### Tests for User Story 3

- [ ] T013 [US3] Add Playwright coverage for mobile menu visibility, destination parity, close-after-navigation, keyboard operation, focus visibility, and disclosure state in `tests/e2e/workspace-navigation.spec.ts`.

### Implementation for User Story 3

- [ ] T014 [US3] Replace the separate desktop sidebar and mobile bottom bar with the shared responsive shadcn Sidebar presentation in `src/features/navigation/app-frame.tsx` and `src/features/navigation/mobile-nav.tsx`.
- [ ] T015 [US3] Ensure the Settings disclosure exposes its expanded state, Enter/Space behavior, visible keyboard focus, and accessible link names through the navigation composition in `src/features/navigation/sidebar-nav.tsx`.

**Checkpoint**: Desktop and mobile render the same route tree, mobile navigation closes after selection, and the complete menu is keyboard accessible.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the integrated change and confirm the documented user-visible contract.

- [ ] T016 Run `npm run typecheck` and `npm run lint` and address feature-related failures in the changed files under `src/features/navigation/`, `src/app/(workspace)/workspace/reports/`, and `src/components/ui/`.
- [ ] T017 Run the focused Vitest suite `npx vitest run tests/domain/navigation.test.ts` and the Playwright suite `npm run test:e2e -- tests/e2e/workspace-navigation.spec.ts`; resolve feature-related failures in `tests/domain/navigation.test.ts` and `tests/e2e/workspace-navigation.spec.ts`.
- [ ] T018 Verify every destination and interaction in `specs/002-grouped-navigation/quickstart.md` against the UI contract in `specs/002-grouped-navigation/contracts/navigation-ui.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 installs the shared Sidebar source component; no other phase can implement against it before completion.
- **Foundational (Phase 2)**: No separate tasks; the authenticated workspace shell, shadcn configuration, and test runners already exist.
- **User Story 1 (Phase 3)**: Starts after T001. T002 and T003 precede navigation implementation to establish expected route behavior; T007 is independent of the navigation files after setup.
- **User Story 2 (Phase 4)**: Starts after User Story 1 because it extends the shared navigation entries, rendering, and route matching.
- **User Story 3 (Phase 5)**: Starts after User Story 2 because it integrates the completed grouped navigation into the responsive shell.
- **Polish (Phase 6)**: Starts after all selected stories are integrated.

### User Story Dependencies

- **US1 (P1)**: Depends on Setup only. Delivers the MVP top-level navigation and Reports page.
- **US2 (P1)**: Depends on US1; extends its central route tree and renderer with Settings children.
- **US3 (P2)**: Depends on US2; reuses the completed grouped menu in the mobile presentation and verifies accessibility.

### Parallel Opportunities

- T003 (top-level browser test file) and T007 (Reports page) touch different files and can be implemented in parallel after T001.
- Within US2, T008 and T009 touch different test files and can be implemented in parallel.
- User stories are intentionally sequential because they extend the same navigation tree and renderer. Polish validation commands can run independently after implementation is complete.

## Parallel Example: User Story 1

```text
After T001:
Task T003: Add top-level authenticated browser navigation coverage in tests/e2e/workspace-navigation.spec.ts
Task T007: Add the Reports page in src/app/(workspace)/workspace/reports/page.tsx
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (T001).
2. Complete US1 tests and implementation (T002-T007).
3. Validate top-level routes, active states, and the Reports page independently.
4. Stop for an MVP review before adding grouped Settings behavior.

### Incremental Delivery

1. Setup plus US1 delivers the main workspace destinations and Reports.
2. US2 adds grouped Business, Catalog, and Team settings destinations.
3. US3 adds responsive parity and keyboard/mobile interactions.
4. Run all polish checks (T016-T018) before marking the feature complete.

## Notes

- Every task uses the required unchecked checklist form with a sequential ID; user story tasks carry their story label and all task descriptions name the relevant file path.
- `[P]` marks only tasks intended to work independently on separate files.
- Route destinations remain protected by the existing authenticated workspace layout; no authorization or tenant-data behavior changes are included.

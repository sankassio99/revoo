# Implementation Plan: Grouped Workspace Navigation

**Branch**: `002-grouped-navigation` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-grouped-navigation/spec.md`

## Summary

Replace the separate desktop sidebar and mobile bottom bar with one shared, responsive shadcn Sidebar navigation. The navigation will use a single route/configuration tree for the existing workspace areas, including nested Business, Catalog, and Team settings; preserve contextual active states; and add the currently missing Reports route as a lightweight page without inventing report data.

## Technical Context

**Language/Version**: TypeScript; Node.js `>=22 <25`

**Primary Dependencies**: Next.js 16 App Router, React 19, shadcn CLI 4.22.0 configured with `base-nova`, Lucide icons; existing Tailwind CSS setup

**Storage**: None for navigation; no database or authentication changes

**Testing**: Vitest for pure route matching/configuration tests; Playwright Chromium for authenticated desktop/mobile navigation; ESLint and TypeScript typecheck

**Target Platform**: Responsive web application; minimum viewport width 320px

**Project Type**: Next.js web application

**Performance Goals**: Keep navigation immediate and avoid new server requests or client-side data loading for route matching

**Constraints**: Preserve workspace authentication and tenant selection; retain existing visual palette and workspace actions; use the project's configured shadcn registry and aliases; do not add report metrics that the product does not currently provide

**Scale/Scope**: Shared workspace shell, one centralized navigation tree, its desktop/mobile presentations, and a basic Reports destination

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Tenant isolation and least privilege**: PASS. Existing authenticated workspace layout remains the boundary; navigation does not add data access or change authorization.
- **Privacy and communication consent**: PASS. No customer data or messaging behavior is introduced.
- **Reliable business invariants**: PASS. No appointment, customer, or financial records are changed.
- **Verifiable quality and operations**: PASS. Route matching and user-visible navigation will be covered by focused tests; no operational claims or backend changes are introduced.
- **Resilient, focused architecture**: PASS. Use the existing Next.js/TypeScript stack and configured UI system; no new service, persistence, or unnecessary package is planned.

No constitution violations or exceptions are required.

## Project Structure

### Documentation (this feature)

```text
specs/002-grouped-navigation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── navigation-ui.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (workspace)/
│       └── workspace/
│           └── reports/
│               └── page.tsx
├── components/
│   └── ui/
│       └── sidebar.tsx           # Added from configured shadcn component registry
└── features/
    └── navigation/
        ├── app-frame.tsx         # Compose shared responsive navigation
        ├── mobile-nav.tsx        # Remove/replace separate bottom-bar navigation
        ├── navigation-items.ts   # Central labels, routes, icons, and groups
        └── sidebar-nav.tsx       # Render route tree and active states

tests/
├── domain/
│   └── navigation.test.ts        # Route matching and active-state behavior
└── e2e/
    └── workspace-navigation.spec.ts
```

**Structure Decision**: This is a focused change in the existing Next.js single-project structure. The workspace route group already wraps pages with `AppFrame`; the shared navigation stays in `src/features/navigation/`, the shadcn Sidebar primitive is added under `src/components/ui/`, and Reports gets a route under the existing workspace segment. A pure route matcher may live alongside the central navigation definition to keep it testable without a DOM.

## Complexity Tracking

No constitution violations to justify.

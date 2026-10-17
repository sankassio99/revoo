# Quickstart: Grouped Workspace Navigation

## Prerequisites

- Node.js version supported by the repository (`>=22 <25`).
- Project dependencies installed.
- For authenticated browser checks, the repository's documented Firebase Emulator Suite and test workspace setup.

## Validate

1. Run static checks:

   ```powershell
   npm run typecheck
   npm run lint
   ```

2. Run the focused route matching tests:

   ```powershell
   npx vitest run tests/domain/navigation.test.ts
   ```

3. Start the local workspace using the repository's Firebase emulator setup and run the focused browser tests:

   ```powershell
   npm run test:e2e -- tests/e2e/workspace-navigation.spec.ts
   ```

## Expected outcomes

- Overview, Appointments, Customers, Follow-up, Reports, and all three Settings destinations open their specified routes.
- The correct destination is active on direct loads and after navigation; customer detail keeps Customers active.
- Settings expands on Catalog and Team routes and can also be expanded/collapsed by keyboard.
- Desktop and mobile expose the same destination tree; selecting a mobile destination closes the navigation surface.
- The Reports route renders without a missing-page response and does not claim to show real analytics.
- Keyboard use provides visible focus and accessible disclosure state; layout remains usable at 320px and desktop widths.

For route definitions and interaction semantics, see [the UI contract](./contracts/navigation-ui.md). For the navigation configuration concepts, see [the data model](./data-model.md).

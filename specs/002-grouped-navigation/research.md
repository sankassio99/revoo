# Research: Grouped Workspace Navigation

## Decision 1: Use the configured shadcn Sidebar for the shared workspace navigation

**Decision**: Add the official `sidebar` component through the configured shadcn CLI, then compose the desktop sidebar and mobile sheet presentation from the same navigation tree. Use the component's sidebar menu/submenu primitives and accessible collapse behavior rather than maintaining a bespoke desktop nav and a separate mobile nav.

**Rationale**: The project already has `components.json`, the shadcn CLI, a UI alias, Tailwind CSS, and Lucide icons. The current `AppFrame` renders a fixed desktop sidebar and `MobileNav` renders a distinct bottom bar, which means labels and destinations can drift. The configured Sidebar is designed for responsive navigation and nested menu items; adding the source component locally matches the project's shadcn usage model.

**Alternatives considered**:
- Keep the bespoke sidebar and expand the bottom bar: rejected because it duplicates navigation structure and the compact mobile bar cannot expose the required settings sub-items accessibly.
- Replace the sidebar with a top navigation bar: rejected because the existing desktop shell is already organized around a sidebar and the standard component supports mobile presentation without introducing another layout.
- Build custom disclosure and mobile drawer behavior: rejected because this recreates behavior already provided by the selected component.

## Decision 2: Keep a single static navigation tree and derive active states from the current URL

**Decision**: Define the destination labels, paths, icon references, and Settings children in one central navigation module. Resolve an exact active item for a root destination and a prefix active item for section routes such as customer details. Expand Settings when a descendant route is current; keep the group active when its own branch is current.

**Rationale**: The destinations are static application routes and do not require remote data. A central tree satisfies the one-source-of-truth requirement and avoids separate desktop/mobile route lists. URL-derived state correctly handles refreshes and direct links.

**Alternatives considered**:
- Store navigation state in Firestore or user preferences: rejected because route structure is application configuration, not tenant data.
- Keep separate desktop and mobile item lists: rejected because it allows route and label parity to diverge.
- Use broad substring matching: rejected because similarly named paths can be marked active incorrectly.

## Decision 3: Add a small Reports page without implying report functionality

**Decision**: Create a basic, authenticated Reports route with a title and honest initial/empty content; do not invent aggregate metrics or add a reporting service. Keep the existing workspace-level Reports destination.

**Rationale**: The current sidebar links to `/workspace/reports`, but no route exists. The user selected creating a basic Reports page. Existing dashboard data is not a report contract, and presenting it as reporting would imply unavailable functionality.

**Alternatives considered**:
- Remove Reports from the navigation: rejected because it was already listed and the user confirmed the page should be in scope.
- Build full report generation and analytics: rejected because neither the request nor the spec defines report types, filters, or metrics.
- Reuse dashboard figures as reports: rejected because their semantics and authorization/query requirements are not defined as reports.

## Decision 4: Keep workspace identity, switching, account actions, and authorization unchanged

**Decision**: Refactor only the presentation of the navigation shell; preserve the existing authenticated workspace layout, workspace switcher, create-workspace action, user identity, sign-out action, and appointment CTA.

**Rationale**: These controls already belong to `AppFrame`, which is wrapped by the authenticated workspace layout. Changing their behavior is outside the navigation feature and could affect tenant selection or access.

**Alternatives considered**:
- Move workspace selection or access checks into the navigation component: rejected because that adds coupling and duplicates existing layout/auth responsibilities.
- Modify Firestore or role rules for menu visibility: rejected because the current request does not define new role-specific destinations or permissions.

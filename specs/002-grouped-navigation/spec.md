# Feature Specification: Grouped Workspace Navigation

**Feature Branch**: `002-grouped-navigation`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Use the shadcn components to create a new navbar, add pages: follow-up, settings/catalog, settings/team, and others. Use sub items for group menu. Use shadcn skills to download the components."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate all workspace areas from one menu (Priority: P1)

A signed-in workspace member sees a single navigation menu listing every main area of the workspace (Overview, Appointments, Customers, Follow-up, Reports) plus a collapsible Settings group, and can reach any area in one or two clicks.

**Why this priority**: Follow-up, catalog and team pages exist but are not discoverable from the current menu; navigation is the core value.

**Independent Test**: Sign in, open the workspace, and click each menu entry; each opens the matching page and is highlighted as active.

**Acceptance Scenarios**:

1. **Given** a signed-in member in a workspace, **When** they view the menu, **Then** they see Overview, Appointments, Customers, Follow-up, Reports and a Settings group.
2. **Given** the menu is shown, **When** they select Follow-up, **Then** the follow-up page opens and the Follow-up entry is marked as current.
3. **Given** the menu is shown, **When** they select an entry, **Then** only that entry is marked current.

---

### User Story 2 - Reach settings pages through a group with sub-items (Priority: P1)

Settings is a group that expands to show sub-items: Business (general settings), Catalog and Team. Selecting a sub-item opens its page.

**Why this priority**: Catalog and Team settings are otherwise unreachable without typing a URL.

**Independent Test**: Expand Settings, select Catalog, then Team; each page opens and its sub-item and parent group show as active.

**Acceptance Scenarios**:

1. **Given** the menu is shown, **When** the member expands Settings, **Then** Business, Catalog and Team sub-items appear.
2. **Given** the member is on the Team page, **When** the page loads, **Then** the Settings group is expanded and Team is marked current.
3. **Given** the Settings group is expanded, **When** the member collapses it, **Then** the sub-items are hidden and the group stays marked active if a child page is open.

---

### User Story 3 - Use the same menu on mobile and with a keyboard (Priority: P2)

On small screens the menu opens from a toggle and presents the same entries and groups. All entries and groups can be operated by keyboard and announced by screen readers.

**Why this priority**: Parity across devices and accessibility, after the core navigation works.

**Independent Test**: At phone width, open the menu, expand Settings, choose Catalog; the menu closes and the page opens. Repeat using keyboard only.

**Acceptance Scenarios**:

1. **Given** a phone-sized screen, **When** the member opens the menu, **Then** the same entries and Settings group are shown.
2. **Given** the mobile menu is open, **When** they select a page, **Then** the menu closes and the page opens.
3. **Given** keyboard-only use, **When** the member tabs through the menu, **Then** every entry and group toggle is reachable, visibly focused and operable with Enter/Space.

---

### Edge Cases

- Detail pages (e.g. a single customer) keep their parent entry (Customers) marked active.
- Visiting the Settings root page marks Business active, not Catalog or Team.
- Very narrow screens or long labels must not hide or overlap entries.
- Navigating to an unknown address leaves no entry marked active.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workspace MUST provide one navigation menu present on every workspace page.
- **FR-002**: The menu MUST list Overview, Appointments, Customers, Follow-up and Reports as top-level entries linking to their pages.
- **FR-003**: The menu MUST provide a Settings group with sub-items Business, Catalog and Team linking to the settings, settings/catalog and settings/team pages.
- **FR-004**: Groups MUST be expandable and collapsible, and a group MUST be auto-expanded when one of its sub-items is the current page.
- **FR-005**: The menu MUST mark exactly the current page as active, and mark a group active when any child is current.
- **FR-006**: Pages that belong to a section (e.g. customer detail) MUST keep that section's entry active.
- **FR-007**: The menu MUST have a mobile presentation with the same entries and groups, closing after a page is chosen.
- **FR-008**: All entries and group toggles MUST be keyboard operable with visible focus and accessible names/expanded state.
- **FR-009**: The menu structure MUST be defined in one place so adding a new page or group needs a single entry.
- **FR-010**: Follow-up, settings/catalog and settings/team pages MUST be reachable and render without errors.
- **FR-011**: A Reports page MUST be available from the workspace menu and render without errors.

### Key Entities

- **Menu Entry**: A label, an icon, a destination page, and an active state.
- **Menu Group**: A label, an icon, an expanded state, and an ordered list of sub-items (Menu Entries).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can reach any primary workspace area in at most 2 clicks from any other workspace page.
- **SC-002**: Every primary workspace area listed in FR-002 and FR-003 is reachable from the menu and receives correct active highlighting.
- **SC-003**: 90% of test users find the Catalog and Team settings on first attempt without guidance.
- **SC-004**: The full menu is operable by keyboard alone and passes an automated accessibility check with no critical issues.
- **SC-005**: Menu layout remains fully usable from 320px to desktop widths.

## Assumptions

- Existing workspace pages are kept; this feature adds a basic Reports page because the current navigation already lists Reports but the route is missing. "And others" means the other current workspace pages, with no new feature pages beyond those listed.
- Customer-detail and new-appointment routes remain accessible through their existing contextual flows and are not separate primary menu destinations.
- The new menu replaces the current sidebar and mobile navigation.
- Existing authentication and workspace role rules are unchanged.

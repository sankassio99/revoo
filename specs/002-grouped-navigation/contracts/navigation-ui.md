# Workspace Navigation UI Contract

## Scope

This contract describes the user-visible route and interaction behavior of the shared navigation. It adds no public API, data schema, or authorization rule.

## Destinations

| Menu label | Route | Placement |
|---|---|---|
| Overview | `/workspace` | Top-level |
| Appointments | `/workspace/appointments` | Top-level |
| Customers | `/workspace/customers` | Top-level |
| Follow-up | `/workspace/follow-up` | Top-level |
| Reports | `/workspace/reports` | Top-level |
| Business | `/workspace/settings` | Settings child |
| Catalog | `/workspace/settings/catalog` | Settings child |
| Team | `/workspace/settings/team` | Settings child |

The existing new-appointment action and customer-detail routes remain reachable in their current contextual flows; they do not become additional primary menu entries.

## Interaction

- The same labels, order, routes, grouping, and active-route semantics are used on desktop and mobile.
- Settings is an operable disclosure. It reports its expanded/collapsed state to assistive technology and expands automatically on a Settings descendant route.
- Choosing a mobile destination navigates to the route and closes the mobile navigation surface.
- The active destination is exposed as the current page, and section pages (such as a customer detail route) keep their section active.
- All navigation links and the group disclosure are keyboard reachable, have visible focus, and have accessible names.
- The Reports route renders a basic page without representing placeholder or unavailable metrics as real data.

## Authentication and tenancy

All destinations remain inside the existing authenticated workspace route group. This navigation contract grants no permissions and does not replace server-side membership or tenant authorization.

# Data Model: Grouped Workspace Navigation

This feature introduces no persisted entities or database changes. The navigation model is static application configuration.

## Navigation Entry

Represents one route in the workspace navigation tree.

| Field | Meaning | Validation |
|---|---|---|
| `label` | User-visible destination name | Non-empty |
| `href` | Absolute workspace-relative route | Is `/workspace` or starts with `/workspace/`; unique among sibling entries |
| `icon` | Icon component displayed with the destination | Present |
| `match` | Whether the route matches only exactly or also its descendants | Defaults to exact for root destinations; section routes may match descendants |

## Navigation Group

Represents a collapsible set of related navigation entries.

| Field | Meaning | Validation |
|---|---|---|
| `label` | User-visible group name | Non-empty |
| `icon` | Icon component displayed with the group | Present |
| `items` | Ordered child navigation entries | Contains at least one entry; child paths are unique |

The Settings group contains Business (`/workspace/settings`), Catalog (`/workspace/settings/catalog`), and Team (`/workspace/settings/team`). Group expansion is UI state derived initially from the current child route and can be toggled by the user.

## Active Route State

Derived from the current URL; it is not persisted.

- A root destination is active on exact path equality.
- A section destination remains active for its nested pages, including `/workspace/customers/{customerId}`.
- Settings is expanded when one of its children is current and remains visually active while a child is current.
- Only a matching destination is exposed as the current page; unknown paths do not activate an entry.
- The Reports route is a simple destination page and has no report data entity in this feature.

# Data Model: Portuguese and English Language Support

## Language Preference

Represents the current interface language and whether it came from an explicit browser choice or automatic browser-language resolution.

| Field | Type / values | Validation and behavior |
|---|---|---|
| `locale` | `pt` or `en` | Required active locale. Reject any saved value outside the supported set. |
| `source` | `user` or `browser` | `user` when a valid explicit browser preference exists; otherwise `browser`. Used to describe precedence, not to change authorization. |

### Resolution and State Transitions

1. If a valid explicit preference exists, resolve to that locale with source `user`.
2. Otherwise map the browser's primary preferred language tag to `pt` or `en`; regional variants use the corresponding base locale.
3. If the browser preference is missing or unsupported, resolve to `en`.
4. An explicit selection updates the active locale and source to `user` and persists the locale in the same browser.
5. Invalid or unsupported stored values are ignored and resolved from the browser preference instead.

The automatically inferred language is not stored as an explicit user choice. Preference is browser-local and does not sync to an account or workspace.

## Supported Language

Represents a product-provided interface language.

| Field | Type / values | Validation and behavior |
|---|---|---|
| `locale` | `pt` or `en` | One of the two supported base-language identifiers. |
| `messages` | Semantic-keyed product text | Every supported key exists in both language catalogs. User-entered, customer-provided, and business-provided content is not part of the catalog. |

## Relationships and Persistence Boundaries

- One browser has at most one explicit active language preference.
- The preference is not an account, workspace, or tenant entity.
- Locale selection never mutates domain values such as currency, time zone, appointment times, or user-provided text.
- Date and number formatting derives from the active `locale`; currency and time zone remain explicit domain inputs.

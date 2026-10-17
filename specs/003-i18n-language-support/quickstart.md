# Quickstart: Validate Portuguese and English Language Support

## Prerequisites

- Node.js 22-24 and project dependencies installed.

## Automated Validation

Run focused locale and message-catalog unit tests:

```powershell
npm run test:unit
```

Run the repository's static checks:

```powershell
npm run typecheck
npm run lint
```

## Validation Scope

Browser tests, Playwright, and manual browser checks are intentionally excluded for this feature. Use the unit suite, typecheck, lint, and source-level review of translated route content and locale formatting.

See [the language preference contract](./contracts/language-preference.md) for selector behavior and [the data model](./data-model.md) for persistence and precedence.

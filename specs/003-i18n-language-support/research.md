# Research: Portuguese and English Language Support

## Locale Detection and Precedence

**Decision**: Support only the base locale identifiers `pt` and `en`. When an explicit, valid language choice is present in the browser preference cookie, use it. Otherwise resolve the browser's primary preferred language, mapping Portuguese and English regional tags to their base locale. Use English when the preference is missing, malformed, or unsupported.

**Rationale**: This matches the spec's precedence and fallback requirements and keeps the persisted value allowlisted and independent of user or workspace identity. A base language choice avoids accidentally promising region-specific translations.

**Alternatives considered**:
- Infer the language on the client after rendering: simpler server markup, but can briefly show English or the wrong document language before client initialization.
- Store the preference in workspace or account settings: would incorrectly make a personal browser display preference tenant-specific, add data and authorization work, and fail for visitors before sign-in.
- Add URL locale prefixes: would change all routes and navigation beyond the requested settings controls and same-app persistence.

## Server and Client Rendering

**Decision**: Resolve the locale from the request at the root layout and use the same pure locale rules for server-rendered pages. Provide that locale to a root-level client provider for interactive components. On explicit selection, update the provider and document language, persist the allowlisted cookie, and refresh server-rendered content.

**Rationale**: The app contains both server-rendered route/page content and client-side forms. A client context alone cannot localize text emitted by Server Components. A request-readable preference lets the first response and client provider agree, supports public and signed-in routes, and ensures a manual choice remains in effect across route transitions and visits.

**Alternatives considered**:
- Use a client provider only: does not supply locale context to server-rendered page text and creates a risk of hydration mismatch or visible language flash.
- Keep translations only in client islands by converting every page to a client-rendered page: unnecessarily expands client-side rendering and complicates routes that load authorized workspace data on the server.

## Message Catalogs and Translation Coverage

**Decision**: Keep product-provided messages in parallel, typed English and Portuguese catalogs with stable semantic keys. Provide one translation access pattern usable in server-rendered pages and client components. Verify catalog key parity and test critical representative messages. Translate accessible names, validation and status messages, empty states, and navigation in addition to visible labels.

**Rationale**: The app currently has no internationalization library in its dependency manifest. A focused, typed catalog fits the two-language requirement, avoids a new runtime dependency, and keeps translated text separate from user/business records.

**Alternatives considered**:
- Install a general-purpose localization framework: useful for larger translation workflows and pluralization needs, but adds dependency and configuration not justified by the current two-locale scope.
- Leave some screens in English or translate only common page titles: violates full existing-screen coverage in the specification.

## Persistence and Browser Default

**Decision**: Store only an explicit `pt` or `en` selection in a same-site, root-scoped, long-lived browser cookie. Do not persist the automatically inferred default as if it were a manual choice.

**Rationale**: The server must be able to read the explicit choice before rendering server page content. Distinguishing explicit choice from default allows a later browser-preference change to take effect until the user selects a language.

**Alternatives considered**:
- `localStorage` only: readable only in the browser, so server-rendered routes cannot reliably use it before producing the response.
- Firestore or account profile: adds unnecessary personal preference data to tenant/account services and excludes unauthenticated visitors.

## Date and Number Presentation

**Decision**: Format displayed dates and numbers using the active locale and standard platform internationalization facilities. Continue to pass the business's configured time zone and currency explicitly wherever those are part of the current display.

**Rationale**: Locale affects presentation conventions, not the underlying date, number, currency, or business configuration. Existing domain formatting and tests should remain the source of business-value semantics.

**Alternatives considered**:
- Change a business's time zone or currency based on interface language: violates the feature's data-preservation requirements and business invariants.
- Translate stored dates, amounts, or user-provided descriptions: corrupts or changes data rather than presenting it locally.

## Test Strategy

**Decision**: Add unit coverage for supported/unsupported/regional locale resolution, preference precedence, catalog parity, interpolation, and representative date/number formatting. Run existing typecheck and lint checks. Do not add or run browser tests or Playwright.

**Rationale**: Unit tests validate deterministic locale rules and translation behavior. Static checks validate integration without introducing browser automation, in accordance with the feature constraints.

**Alternatives considered**:
- Browser tests: excluded by the feature constraints.
- Full Firestore emulator/security suite: unnecessary for a browser-only preference that does not change database or authorization behavior.

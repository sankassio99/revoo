# Language Preference UI Contract

## Supported Values

- `pt`: Portuguese.
- `en`: English.
- Display both choices with clear, language-independent names: **Português** and **English**.

Only these values are valid for explicit choices and persisted preferences. Regional browser tags such as `pt-BR`, `pt-PT`, and `en-US` map to their base supported language.

## Initial Selection

1. Use a valid explicit language preference saved by the browser.
2. Otherwise use the browser's primary preferred language when it maps to Portuguese or English.
3. Otherwise use English.

An invalid saved value behaves as though no explicit preference exists.

## Selection Controls

- Provide an accessible language selector on the home page and in Settings.
- Each control reflects the same active selection and exposes an accessible name and current value.
- Selecting a different language updates the shared interface, accessible labels, system feedback, and the document language.
- Selection remains effective during navigation and on subsequent visits using the same browser.
- Settings selection is a personal browser preference, not workspace configuration; it is available independently of workspace-owner permissions.

## Content and Formatting

- Product-provided interface text and system-generated messages use the active language.
- User-entered, customer-provided, and business-provided content is displayed without automatic translation.
- Dates and numbers use the active language's presentation conventions while business currency and configured time zone are preserved.
- Unsupported browser languages use English unless an explicit supported selection exists.

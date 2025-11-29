# Component Audit

## UI Primitives
### Dialog (`components/ui-components.tsx`)
-   **Issue**: Originally implemented as a `fixed` div with high z-index and manual overlay management.
-   **Fix**: Refactored to use the native HTML5 `<dialog>` element.
    -   Uses `ref.showModal()` for top-layer promotion.
    -   Uses `::backdrop` pseudo-element for the overlay.
    -   Handles `Escape` key and backdrop clicks natively.

### Popovers
-   **Recommendation**: Future refactors should convert `SlashMenu` and dropdowns to use the Popover API (`<div popover>`) to avoid z-index wars and improve accessibility.

## Document Editor
-   **Structure**: `EditorBlock` is monolithic. It should be broken down into smaller, atomic server components in a Next.js migration.
-   **Drag & Drop**: Uses native HTML5 DnD API, which aligns with the "Native First" philosophy.

## CSS / Tailwind
-   **Configuration**: Currently using CDN.
-   **Fix**: Ensure `className` usage uses `cn()` util consistently for merging.

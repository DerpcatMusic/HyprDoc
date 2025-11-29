# Architecture Audit (2026 Edition)

## Stack Mismatch Analysis
The provided guidelines specify a **Next.js App Router** stack with Server Components and Server Actions. However, the current codebase is a **Client-Side React Application** (likely Vite or CRA structure).

### Discrepancies
1.  **Routing**: Current app uses a custom `useHashLocation` hook for client-side hash routing. Guidelines require Next.js App Router (file-system based routing).
2.  **Data Fetching**: Current app fetches data in `useEffect` or via `SupabaseService` directly in components. Guidelines require fetching in Server Components (`page.tsx`).
3.  **State Management**: Current app relies heavily on `DocumentContext` and `useState`. Guidelines recommend URL Search Params for shareable state.
4.  **Styling**: Current app loads Tailwind via CDN (`<script>`). Guidelines recommend Tailwind v4 build process.

## Migration Recommendations
To fully align with the guidelines, a complete migration to Next.js is required:
1.  Move `components/views/*.tsx` to `app/[route]/page.tsx`.
2.  Replace `DocumentContext` with Server Actions for mutations (`saveDocument`, `updateBlock`).
3.  Replace `SupabaseService` client-side calls with generic Data Access Layer (DAL) functions called from Server Components.
4.  Remove `index.html` and `index.tsx`; use `app/layout.tsx`.

## Immediate Improvements (Implemented)
Within the constraints of the current architecture, we have enforced:
1.  **Native Web APIs**: Refactored `Dialog` to use the HTML5 `<dialog>` element.
2.  **Type Safety**: Removed usage of `any` in `types.ts`.
3.  **Clean Code**: Improved `gemini.ts` to strictly follow SDK best practices.

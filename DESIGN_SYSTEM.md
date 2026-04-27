# Design System Map

This repo uses a layered CSS structure so design changes have a clear home and Codex can keep edits small.

## Where To Change What

- `src/styles/tokens.css`
  - canonical design tokens only
  - colors, typography, shadows, borders, and shared semantic variables
  - update this when the brand palette or spacing scale changes
- `src/styles/base.css`
  - global element defaults only
  - `html`, `body`, headings, links, form controls, focus rings, selection, and neutral browser resets
  - update this when the app-wide baseline behavior changes
- `src/styles/components.css`
  - shared UI primitives and reusable layout classes
  - page frames, panels, chips, buttons, inputs, selects, badges, page hero, page section, and shared browse controls
  - update this when the app-wide look of a reusable component changes
- `src/app/layout/AppShell.css`
  - app chrome only
  - header, navigation, mobile nav, floating actions, skip link, sync panels, and shell-level modals
  - update this when navigation or framing changes
- `src/ui/components/*.tsx`
  - shared component APIs
  - `Button`, `Input`, `Select`, `Badge`, `PageLayout`, and `LoadingState`
  - update these when the shape or variant API of a reusable control changes
- `src/features/books/**`
  - feature-specific styling and behavior
  - use this area for screen-local layout, book cards, filters, and page-specific surface treatments
  - if a pattern repeats across 2+ screens, promote it to `src/styles/components.css` or `src/ui/components`

## Editing Rules

- Keep tokens centralized. Do not redefine palette values in both Tailwind config and CSS.
- Use semantic names for design tokens and shared classes.
- If a class string starts repeating, move it into `src/styles/components.css` or a shared component.
- If a visual change affects multiple pages, update the shared primitive first, then only override locally when a screen truly needs a different layout.
- Avoid creating new one-off colors or shadows inside feature pages unless the variation is intentional and documented.

## Current Shared Primitives

- `Button`
- `Input`
- `Select`
- `Badge`
- `PageLayout`
- `PageHero`
- `PageSection`
- shared CSS classes like `ds-panel-shell`, `ds-panel-surface`, `ds-chip`, and `ds-carousel-button`
- `LoadingState`
- `shelfBrowseControlStyles.ts`

## Legacy Orphan Styles

- `src/features/books/BookListPage.css` is legacy and currently unused.
- If the old `BookListPage.tsx` path stays in the app, migrate it to the shared system instead of reviving the old stylesheet.

## Practical Rule For Codex

- Brand or theme change: edit `src/styles/tokens.css`
- Shared control look: edit `src/styles/components.css` or the shared UI component
- Single screen layout: edit the relevant feature folder only
- Shell/navigation changes: edit `src/app/layout/AppShell.css`

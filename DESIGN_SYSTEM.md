# Design System Map

This repo uses a layered CSS structure so design changes have a clear home and Codex can keep edits small.
Treat this document as the source of truth for styling ownership, shared primitives, and where design edits should land.

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

## Ownership Map

Use this map when deciding where a design change should go.

- Theme or brand shift:
  - `src/styles/tokens.css`
- Global browser baseline or accessibility defaults:
  - `src/styles/base.css`
- Shared visual primitives, repeated page chrome, and common control classes:
  - `src/styles/components.css`
- Shell and navigation behavior:
  - `src/app/layout/AppShell.tsx`
  - `src/app/layout/AppShell.css`
  - `src/app/layout/AppNavigation.tsx`
- Reusable UI APIs:
  - `src/ui/components/Button.tsx`
  - `src/ui/components/Input.tsx`
  - `src/ui/components/Select.tsx`
  - `src/ui/components/Badge.tsx`
  - `src/ui/components/PageLayout.tsx`
  - `src/ui/components/LoadingState.tsx`
- Book feature screens:
  - `src/features/books/ViewBooksPage.tsx`
  - `src/features/books/WishlistPage.tsx`
  - `src/features/books/AdminBooksPage.tsx`
  - `src/features/books/BookDetailPage.tsx`
  - `src/features/books/StatsPage.tsx`
  - `src/features/books/SearchPage.tsx`
  - `src/features/books/SeriesPage.tsx`
  - `src/features/books/GenresPage.tsx`
  - `src/features/books/ReadingListPage.tsx`
- Book feature shared logic:
  - `src/features/books/hooks/*`
  - `src/features/books/components/*`

## Current Shared Styling Rules

- The warm palette is the only active brand direction.
  - Use cream, parchment, sage, brass, warm gray, charcoal, and ink.
  - Avoid reintroducing the old blue/gray dashboard palette in new work.
- Shared CSS classes live in `src/styles/components.css`.
  - Prefer the `ds-` classes there when a pattern is reused.
  - Keep those classes low-specificity so screen-local utilities can still override them when needed.
- Shared React primitives live in `src/ui/components`.
  - Use them instead of rebuilding button, input, select, badge, page, or layout behavior in page files.
- Page-level Tailwind utility classes are acceptable for local layout.
  - They should not become the primary source of reusable styling.
- If you see the same utility bundle repeated in multiple files, promote it.
  - First choice: `src/styles/components.css`
  - Second choice: a shared component in `src/ui/components`
  - Last choice: a one-off screen-local class string

## Screen Patterns

- Library and Wishlist:
  - use `PageLayout`, `PageHero`, `FilterDrawer`, `ShelfBrowseControls`, `BookCard`, and `BookGrid`
  - keep shelf browsing fast and compact
  - keep filters aligned with the shared filter rhythm
- Full-bleed browse banners:
  - use `FullBleedPageHero` when a browse page needs edge-to-edge image framing with only a title and short subtitle
  - keep these banners visually light and avoid placing filters, stats, or dense controls inside them
- Manage:
  - use rows, not cards
  - keep edit actions compact and accessible
  - keep confirmation and save feedback inside the shared system
- Book Detail:
  - use sectioned panels for reading, ownership, and metadata
  - keep the state-changing controls here instead of scattering them across browse pages
- Search, Series, Genres, Reading List, and Stats:
  - use the shared page shell and shared panel primitives
  - keep page-local layout differences small and deliberate

## Shared Primitives In Use

- `Button`
- `Input`
- `Select`
- `Badge`
- `PageLayout`
- `PageHero`
- `FullBleedPageHero`
- `PageSection`
- `LoadingState`
- `BookCard`
- `BookGrid`
- `BookShelfState`
- `FilterDrawer`
- `ShelfBrowseControls`
- shared CSS classes such as `ds-panel-shell`, `ds-panel-surface`, `ds-chip`, `ds-carousel-button`, `ds-muted-meta`, `ds-subtle-text`, `ds-button`, `ds-field`, and `ds-badge`
- `shelfBrowseControlStyles.ts`

## Naming Conventions

- Use semantic token names instead of raw color names when possible.
  - Prefer `--color-surface`, `--color-border`, `--color-text`, `--color-accent`
  - Avoid ad hoc color literals in feature code unless the color has a specific semantic job
- Use `ds-` for shared CSS primitives.
  - Keep those classes small, reusable, and easy to grep
- Keep feature-local utilities visually local.
  - If a utility class only helps one screen, it can stay there
  - If it helps more than one screen, move it up

## Change Workflow

When making a design change:

1. Decide whether the change is global, shared, or screen-local.
2. Edit the lowest-level file that can safely own the change.
3. If multiple screens need the same look, move the style into a shared primitive.
4. Avoid copying the same Tailwind bundle into several files.
5. Update this document when a new shared pattern becomes a standard pattern.

## Legacy Files

- `src/features/books/BookListPage.css` is retired and should stay unused.
- `src/features/books/BookListPage.tsx` has been removed.
- If either pattern appears again, treat it as a regression and migrate it into the shared system instead of reviving the old standalone approach.

## Editing Rules

- Keep tokens centralized. Do not redefine palette values in both Tailwind config and CSS.
- Use semantic names for design tokens and shared classes.
- If a class string starts repeating, move it into `src/styles/components.css` or a shared component.
- If a visual change affects multiple pages, update the shared primitive first, then only override locally when a screen truly needs a different layout.
- Avoid creating new one-off colors or shadows inside feature pages unless the variation is intentional and documented.

## Practical Rule For Codex

- Brand or theme change: edit `src/styles/tokens.css`
- Shared control look: edit `src/styles/components.css` or the shared UI component
- Single screen layout: edit the relevant feature folder only
- Shell/navigation changes: edit `src/app/layout/AppShell.css`

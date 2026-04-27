# Design System Review Checklist

This checklist tracks the design-system pass against [DESIGN_SYSTEM.md](/mnt/c/repos/library/DESIGN_SYSTEM.md).

Checked items are files already reviewed and, where needed, updated to fit the current CSS architecture.
Unchecked items are still pending review in the next pass.

## Reviewed

- [x] [src/styles/tokens.css](/mnt/c/repos/library/src/styles/tokens.css)
- [x] [src/styles/base.css](/mnt/c/repos/library/src/styles/base.css)
- [x] [src/styles/components.css](/mnt/c/repos/library/src/styles/components.css)
- [x] [src/index.css](/mnt/c/repos/library/src/index.css)
- [x] [src/app/RouteErrorBoundary.tsx](/mnt/c/repos/library/src/app/RouteErrorBoundary.tsx)
- [x] [src/app/layout/AppNavigation.tsx](/mnt/c/repos/library/src/app/layout/AppNavigation.tsx)
- [x] [src/app/layout/AppShell.css](/mnt/c/repos/library/src/app/layout/AppShell.css)
- [x] [src/app/layout/AppShell.tsx](/mnt/c/repos/library/src/app/layout/AppShell.tsx)
- [x] [src/ui/components/Button.tsx](/mnt/c/repos/library/src/ui/components/Button.tsx)
- [x] [src/ui/components/Input.tsx](/mnt/c/repos/library/src/ui/components/Input.tsx)
- [x] [src/ui/components/Select.tsx](/mnt/c/repos/library/src/ui/components/Select.tsx)
- [x] [src/ui/components/Badge.tsx](/mnt/c/repos/library/src/ui/components/Badge.tsx)
- [x] [src/ui/components/PageLayout.tsx](/mnt/c/repos/library/src/ui/components/PageLayout.tsx)
- [x] [src/features/books/components/shelfBrowseControlStyles.ts](/mnt/c/repos/library/src/features/books/components/shelfBrowseControlStyles.ts)
- [x] [src/features/books/components/ManageBooksFilterPanel.tsx](/mnt/c/repos/library/src/features/books/components/ManageBooksFilterPanel.tsx)
- [x] [src/features/books/components/ManageBooksResults.tsx](/mnt/c/repos/library/src/features/books/components/ManageBooksResults.tsx)
- [x] [src/features/books/components/ManageDeleteDialog.tsx](/mnt/c/repos/library/src/features/books/components/ManageDeleteDialog.tsx)
- [x] [src/features/books/components/BookForm.tsx](/mnt/c/repos/library/src/features/books/components/BookForm.tsx)
- [x] [src/features/books/components/BookCard.css](/mnt/c/repos/library/src/features/books/components/BookCard.css)
- [x] [src/features/books/components/BookCard.tsx](/mnt/c/repos/library/src/features/books/components/BookCard.tsx)
- [x] [src/features/books/components/GenresPageSections.tsx](/mnt/c/repos/library/src/features/books/components/GenresPageSections.tsx)
- [x] [src/features/books/components/FilterDrawer.tsx](/mnt/c/repos/library/src/features/books/components/FilterDrawer.tsx)
- [x] [src/features/books/components/LibraryDiscoveryPanel.tsx](/mnt/c/repos/library/src/features/books/components/LibraryDiscoveryPanel.tsx)
- [x] [src/features/books/components/ManageBookRow.tsx](/mnt/c/repos/library/src/features/books/components/ManageBookRow.tsx)
- [x] [src/features/books/components/ReadingListPageSections.tsx](/mnt/c/repos/library/src/features/books/components/ReadingListPageSections.tsx)
- [x] [src/features/books/components/ShelfBrowseControls.tsx](/mnt/c/repos/library/src/features/books/components/ShelfBrowseControls.tsx)
- [x] [src/features/books/components/SeriesPageSections.tsx](/mnt/c/repos/library/src/features/books/components/SeriesPageSections.tsx)
- [x] [src/features/books/AdminBooksPage.tsx](/mnt/c/repos/library/src/features/books/AdminBooksPage.tsx)
- [x] [src/features/books/BookDetailPage.tsx](/mnt/c/repos/library/src/features/books/BookDetailPage.tsx)
- [x] [src/features/books/BookListPage.css](/mnt/c/repos/library/src/features/books/BookListPage.css) retired
- [x] [src/features/books/BookListPage.tsx](/mnt/c/repos/library/src/features/books/BookListPage.tsx) reviewed, legacy and not routed
- [x] [src/features/books/GenresPage.tsx](/mnt/c/repos/library/src/features/books/GenresPage.tsx)
- [x] [src/features/books/ReadingListPage.tsx](/mnt/c/repos/library/src/features/books/ReadingListPage.tsx)
- [x] [src/features/books/SearchPage.tsx](/mnt/c/repos/library/src/features/books/SearchPage.tsx)
- [x] [src/features/books/SeriesPage.tsx](/mnt/c/repos/library/src/features/books/SeriesPage.tsx)
- [x] [src/features/books/StatsPage.tsx](/mnt/c/repos/library/src/features/books/StatsPage.tsx)
- [x] [src/features/books/ViewBooksPage.tsx](/mnt/c/repos/library/src/features/books/ViewBooksPage.tsx)
- [x] [src/features/books/WishlistPage.tsx](/mnt/c/repos/library/src/features/books/WishlistPage.tsx)
- [x] [src/features/books/components/book-form/BookFormCoreSection.tsx](/mnt/c/repos/library/src/features/books/components/book-form/BookFormCoreSection.tsx)
- [x] [src/features/books/components/book-form/BookFormMetaSection.tsx](/mnt/c/repos/library/src/features/books/components/book-form/BookFormMetaSection.tsx)
- [x] [src/features/books/components/book-form/BookFormReadingSection.tsx](/mnt/c/repos/library/src/features/books/components/book-form/BookFormReadingSection.tsx)
- [x] [src/features/books/components/book-form/BookFormTabs.tsx](/mnt/c/repos/library/src/features/books/components/book-form/BookFormTabs.tsx)
- [x] [src/features/books/components/book-form/useBookFormController.ts](/mnt/c/repos/library/src/features/books/components/book-form/useBookFormController.ts)
- [x] [src/features/books/bookFormState.ts](/mnt/c/repos/library/src/features/books/bookFormState.ts)
- [x] [src/features/books/bookTypes.ts](/mnt/c/repos/library/src/features/books/bookTypes.ts)
- [x] [src/features/books/hooks/discoveryBrowseShared.ts](/mnt/c/repos/library/src/features/books/hooks/discoveryBrowseShared.ts)
- [x] [src/features/books/hooks/useAdminBooksManager.ts](/mnt/c/repos/library/src/features/books/hooks/useAdminBooksManager.ts)
- [x] [src/features/books/hooks/useGenresBrowse.ts](/mnt/c/repos/library/src/features/books/hooks/useGenresBrowse.ts)
- [x] [src/features/books/hooks/useGlobalSearchPage.ts](/mnt/c/repos/library/src/features/books/hooks/useGlobalSearchPage.ts)
- [x] [src/features/books/hooks/useReadingListPage.ts](/mnt/c/repos/library/src/features/books/hooks/useReadingListPage.ts)
- [x] [src/features/books/hooks/useSeriesBrowse.ts](/mnt/c/repos/library/src/features/books/hooks/useSeriesBrowse.ts)
- [x] [src/features/books/hooks/useShelfBooks.ts](/mnt/c/repos/library/src/features/books/hooks/useShelfBooks.ts)
- [x] [src/features/books/hooks/useViewBooksPageState.ts](/mnt/c/repos/library/src/features/books/hooks/useViewBooksPageState.ts)
- [x] [src/features/books/hooks/useWishlistPageState.ts](/mnt/c/repos/library/src/features/books/hooks/useWishlistPageState.ts)
- [x] [src/features/books/readingListPreferences.ts](/mnt/c/repos/library/src/features/books/readingListPreferences.ts)
- [x] [src/features/books/shelfViewPreferences.ts](/mnt/c/repos/library/src/features/books/shelfViewPreferences.ts)

## Still To Review

- None remaining.

## Notes

- Review any unchecked file against [DESIGN_SYSTEM.md](/mnt/c/repos/library/DESIGN_SYSTEM.md) before introducing new styling.
- If a pattern repeats across multiple unchecked files, move it into [src/styles/components.css](/mnt/c/repos/library/src/styles/components.css) or a shared UI component.

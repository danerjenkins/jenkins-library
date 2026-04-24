import { useDeferredValue, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { sortBooksBySeriesOrder } from "../../data/bookRepo";
import { Button } from "../../ui/components/Button";
import { PageHero, PageLayout } from "../../ui/components/PageLayout";
import { Select } from "../../ui/components/Select";
import { BOOK_FORMAT_LABELS, getReadStatus, type Book } from "./bookTypes";
import { BookCard, BookGrid, BookShelfState } from "./components/BookCard";
import { FilterDrawer } from "./components/FilterDrawer";
import { LibraryDiscoveryPanel } from "./components/LibraryDiscoveryPanel";
import {
  actionLinkClasses,
  filterFieldGridClasses,
  ownershipSegmentOptions,
  SegmentedControl,
  ShelfDensitySelector,
  ShelfSearchField,
} from "./components/ShelfBrowseControls";
import { useMergedShelfBooks } from "./hooks/useShelfBooks";
import {
  getSortedFormats,
  getSortedStrings,
  readFilterOptions,
  readStatusByFilter,
  sortOptions,
  useViewBooksPageState,
  type OwnershipFilter,
  type SortOption,
} from "./hooks/useViewBooksPageState";
import { CARD_SIZE_OPTIONS } from "./shelfViewPreferences";

function sortVisibleBooks(books: Book[], sortBy: SortOption) {
  if (sortBy === "series") {
    return sortBooksBySeriesOrder(books);
  }

  return [...books].sort((a, b) => {
    switch (sortBy) {
      case "genre-author": {
        const genreCompare = (a.genre ?? "").localeCompare(b.genre ?? "", undefined, {
          sensitivity: "base",
        });
        if (genreCompare !== 0) return genreCompare;

        const authorCompare = a.author.localeCompare(b.author, undefined, {
          sensitivity: "base",
        });
        if (authorCompare !== 0) return authorCompare;

        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      }
      case "title":
        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      case "author":
        return a.author.localeCompare(b.author, undefined, { sensitivity: "base" });
      case "updated":
        return b.updatedAt - a.updatedAt;
      default:
        return 0;
    }
  });
}

function getShelfLabel(ownershipFilter: OwnershipFilter) {
  if (ownershipFilter === "wishlist") {
    return "Wishlist";
  }

  if (ownershipFilter === "all") {
    return "Library + Wishlist";
  }

  return "Library";
}

export function ViewBooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { books, loading } = useMergedShelfBooks();
  const { state, updateState, clearFilters, hasActiveFilters } = useViewBooksPageState(
    searchParams,
    setSearchParams,
  );
  const deferredSearchQuery = useDeferredValue(state.searchQuery);

  const visibleShelfBooks = useMemo(() => {
    if (state.ownershipFilter === "all") {
      return books;
    }

    return books.filter((book) => (book.ownershipStatus ?? "owned") === state.ownershipFilter);
  }, [books, state.ownershipFilter]);

  const availableGenres = useMemo(
    () => getSortedStrings(visibleShelfBooks.map((book) => book.genre)),
    [visibleShelfBooks],
  );
  const availableFormats = useMemo(() => getSortedFormats(visibleShelfBooks), [visibleShelfBooks]);
  const availableSeries = useMemo(
    () => getSortedStrings(visibleShelfBooks.map((book) => book.seriesName)),
    [visibleShelfBooks],
  );
  const noSeriesCount = useMemo(
    () => visibleShelfBooks.filter((book) => !book.seriesName).length,
    [visibleShelfBooks],
  );

  const filteredBooks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const visible = visibleShelfBooks.filter((book) => {
      if (query && !book.title.toLowerCase().includes(query) && !book.author.toLowerCase().includes(query)) {
        return false;
      }

      if (state.filterGenre !== "ALL" && book.genre !== state.filterGenre) {
        return false;
      }

      if (
        state.filterFinished !== "ALL" &&
        getReadStatus(book) !== readStatusByFilter[state.filterFinished]
      ) {
        return false;
      }

      if (state.filterFormat !== "ALL" && book.format !== state.filterFormat) {
        return false;
      }

      if (state.filterSeries === "NONE") {
        return !book.seriesName;
      }

      if (state.filterSeries !== "ALL" && book.seriesName !== state.filterSeries) {
        return false;
      }

      return true;
    });

    return sortVisibleBooks(visible, state.sortBy);
  }, [deferredSearchQuery, state, visibleShelfBooks]);

  const shelfLabel = getShelfLabel(state.ownershipFilter);
  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <PageLayout>
        <PageHero
          title="My Library"
          description="Browse and search your personal collection, wishlist, or both from one shelf."
        >
          <FilterDrawer
            title="Library Filters"
            description="Search the shelf, switch between library and wishlist views, and adjust browsing density without taking over the page."
            isOpen={isFilterDrawerOpen}
            onOpen={() => setIsFilterDrawerOpen(true)}
            onClose={() => setIsFilterDrawerOpen(false)}
            triggerLabel="Filter Shelf"
            actions={
              <>
                <ShelfDensitySelector
                  options={CARD_SIZE_OPTIONS}
                  value={state.cardSize}
                  onChange={(cardSize) => updateState({ cardSize })}
                />
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={clearFilters}
                    className="min-h-11 px-3 text-xs"
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </>
            }
            footer={
              <div className="text-sm text-stone-600">
                Search, filter, and resize the {shelfLabel.toLowerCase()} shelf without leaving the
                page.
              </div>
            }
          >
            <div className={filterFieldGridClasses}>
              <ShelfSearchField
                id="search"
                name="search"
                label="Search"
                value={state.searchQuery}
                onChange={(searchQuery) => updateState({ searchQuery })}
                className="sm:col-span-2 lg:col-span-2"
              />

              <SegmentedControl
                label="Shelf"
                options={ownershipSegmentOptions}
                value={state.ownershipFilter}
                onChange={(ownershipFilter) => updateState({ ownershipFilter })}
              />

              <Select
                id="filter-genre"
                label="Genre"
                value={state.filterGenre}
                onChange={(event) => updateState({ filterGenre: event.target.value })}
                options={[
                  { value: "ALL", label: "All Genres" },
                  ...availableGenres.map((genre) => ({ value: genre, label: genre })),
                ]}
              />

              <Select
                id="filter-finished"
                label="Read Status"
                value={state.filterFinished}
                onChange={(event) => updateState({ filterFinished: event.target.value as typeof state.filterFinished })}
                options={[...readFilterOptions]}
              />

              <Select
                id="filter-format"
                label="Format"
                value={state.filterFormat}
                onChange={(event) => updateState({ filterFormat: event.target.value })}
                options={[
                  { value: "ALL", label: "All Formats" },
                  ...availableFormats.map((format) => ({
                    value: format,
                    label: BOOK_FORMAT_LABELS[format],
                  })),
                ]}
              />

              <Select
                id="filter-series"
                label="Series"
                value={state.filterSeries}
                onChange={(event) => updateState({ filterSeries: event.target.value })}
                options={[
                  { value: "ALL", label: "All Series" },
                  { value: "NONE", label: "No Series" },
                  ...availableSeries.map((series) => ({ value: series, label: series })),
                ]}
              />

              <Select
                id="sort-by"
                label="Sort"
                value={state.sortBy}
                onChange={(event) => updateState({ sortBy: event.target.value as SortOption })}
                options={[...sortOptions]}
              />
            </div>
          </FilterDrawer>

          <LibraryDiscoveryPanel
            loading={loading}
            seriesCount={availableSeries.length}
            genreCount={availableGenres.length}
            noSeriesCount={noSeriesCount}
          />
        </PageHero>

        <section className="space-y-6">
          {loading ? (
            <BookShelfState title="Loading Library..." />
          ) : visibleShelfBooks.length === 0 ? (
            <BookShelfState
              title={state.ownershipFilter === "wishlist" ? "No Wishlist Books Yet" : "No Books Yet"}
              description={
                state.ownershipFilter === "wishlist"
                  ? "Add the first wishlist book to start tracking what you want to read next."
                  : state.ownershipFilter === "all"
                    ? "Start building your shelves by adding books to the library or wishlist."
                    : "Start building your library by adding your first owned book."
              }
              action={
                <Link
                  to={
                    state.ownershipFilter === "wishlist"
                      ? "/admin?add=1&ownership=wishlist"
                      : "/admin?add=1&ownership=owned"
                  }
                  className={actionLinkClasses}
                >
                  {state.ownershipFilter === "wishlist" ? "Add Wishlist Book" : "Add Book"}
                </Link>
              }
            />
          ) : filteredBooks.length === 0 ? (
            <BookShelfState
              title="No Matches Found"
              description="Adjust your search or clear filters to see the full shelf."
              action={
                <Button variant="secondary" onClick={clearFilters} className="text-xs">
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <BookGrid cardSize={state.cardSize}>
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant="view"
                  cardSize={state.cardSize}
                  clickable={true}
                />
              ))}
            </BookGrid>
          )}
        </section>
      </PageLayout>
    </div>
  );
}

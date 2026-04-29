import { Library } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { updateBook } from "../../data/bookRepo";
import { Button } from "../../ui/components/Button";
import { FullBleedPageHero, PageLayout, PageSection } from "../../ui/components/PageLayout";
import { Select } from "../../ui/components/Select";
import { LoadingState } from "../../ui/components/LoadingState";
import { BOOK_FORMAT_LABELS, getReadStatus } from "./bookTypes";
import type { Book } from "./bookTypes";
import { BookCard, BookGrid, BookShelfState } from "./components/BookCard";
import { FilterDrawer } from "./components/FilterDrawer";
import { actionLinkClasses, filterFieldGridClasses } from "./components/shelfBrowseControlStyles";
import { ShelfDensitySelector, ShelfSearchField } from "./components/ShelfBrowseControls";
import { useWishlistShelfBooks } from "./hooks/useShelfBooks";
import { getSortedFormats, getSortedStrings } from "./hooks/useViewBooksPageState";
import { matchesBookSearchQuery } from "./hooks/discoveryBrowseShared";
import {
  useWishlistPageState,
  wishlistReadFilterOptions,
  type WishlistReadFilter,
} from "./hooks/useWishlistPageState";
import { CARD_SIZE_OPTIONS } from "./shelfViewPreferences";

const readStatusByFilter = {
  NEITHER: "neither",
  DANE: "dane",
  EMMA: "emma",
  BOTH: "both",
} as const;

function sortWishlistBooks(books: Book[]) {
  return [...books].sort((a, b) => {
    const genreCompare = (a.genre ?? "").localeCompare(b.genre ?? "", undefined, {
      sensitivity: "base",
    });
    if (genreCompare !== 0) return genreCompare;

    const authorCompare = a.author.localeCompare(b.author, undefined, {
      sensitivity: "base",
    });
    if (authorCompare !== 0) return authorCompare;

    const seriesCompare = (a.seriesName ?? "").localeCompare(b.seriesName ?? "", undefined, {
      sensitivity: "base",
    });
    if (seriesCompare !== 0) return seriesCompare;

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

export function WishlistPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [movingBookIds, setMovingBookIds] = useState<Set<string>>(new Set());
  const { books, setBooks, loading } = useWishlistShelfBooks();
  const { state, updateState, clearFilters, hasActiveFilters } = useWishlistPageState(
    searchParams,
    setSearchParams,
  );
  const deferredSearchQuery = useDeferredValue(state.searchQuery);

  const availableGenres = useMemo(() => getSortedStrings(books.map((book) => book.genre)), [books]);
  const availableFormats = useMemo(() => getSortedFormats(books), [books]);
  const availableSeries = useMemo(
    () => getSortedStrings(books.map((book) => book.seriesName)),
    [books],
  );

  const filteredBooks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const visibleBooks = books.filter((book) => {
      if (query && !matchesBookSearchQuery(book, query)) {
        return false;
      }

      if (state.filterGenre !== "ALL" && book.genre !== state.filterGenre) {
        return false;
      }

      if (
        state.filterReadStatus !== "ALL" &&
        getReadStatus(book) !== readStatusByFilter[state.filterReadStatus as Exclude<WishlistReadFilter, "ALL">]
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

    return sortWishlistBooks(visibleBooks);
  }, [books, deferredSearchQuery, state]);

  const handleMoveToLibrary = useCallback(
    async (bookId: string) => {
      const bookToMove = books.find((book) => book.id === bookId);
      if (!bookToMove) return;

      setMovingBookIds((current) => new Set(current).add(bookId));
      setBooks((currentBooks) => currentBooks.filter((book) => book.id !== bookId));

      try {
        await updateBook(bookId, { ownershipStatus: "owned" });
      } catch (error) {
        console.error("Failed to move book to library:", error);
        setBooks((currentBooks) => sortWishlistBooks([...currentBooks, bookToMove]));
      } finally {
        setMovingBookIds((current) => {
          const next = new Set(current);
          next.delete(bookId);
          return next;
        });
      }
    },
    [books, setBooks],
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <FullBleedPageHero
        title="Wishlist"
        subtitle="A shelf of future favorites and books still making their case."
        backgroundImage="/wishlisthero.png"
      />

      <PageLayout>
        {books.length > 0 ? (
          <PageSection>
            <FilterDrawer
              title="Wishlist Filters"
              description="Keep wishlist browsing focused while leaving room for quick add-to-library actions."
              isOpen={isFilterDrawerOpen}
              onOpen={() => setIsFilterDrawerOpen(true)}
              onClose={() => setIsFilterDrawerOpen(false)}
              triggerLabel="Filter Wishlist"
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
                  {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"} in this view.
                </div>
              }
            >
              <div className={filterFieldGridClasses}>
                <ShelfSearchField
                  id="wishlist-search"
                  name="wishlistSearch"
                  label="Search"
                  value={state.searchQuery}
                  onChange={(searchQuery) => updateState({ searchQuery })}
                  className="sm:col-span-2 lg:col-span-1"
                />

                <Select
                  id="wishlist-filter-genre"
                  label="Genre"
                  value={state.filterGenre}
                  onChange={(event) => updateState({ filterGenre: event.target.value })}
                  options={[
                    { value: "ALL", label: "All Genres" },
                    ...availableGenres.map((genre) => ({ value: genre, label: genre })),
                  ]}
                />

                <Select
                  id="wishlist-filter-read"
                  label="Read Status"
                  value={state.filterReadStatus}
                  onChange={(event) =>
                    updateState({ filterReadStatus: event.target.value as WishlistReadFilter })
                  }
                  options={[...wishlistReadFilterOptions]}
                />

                <Select
                  id="wishlist-filter-format"
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
                  id="wishlist-filter-series"
                  label="Series"
                  value={state.filterSeries}
                  onChange={(event) => updateState({ filterSeries: event.target.value })}
                  options={[
                    { value: "ALL", label: "All Series" },
                    { value: "NONE", label: "No Series" },
                    ...availableSeries.map((series) => ({ value: series, label: series })),
                  ]}
                />
              </div>
            </FilterDrawer>
          </PageSection>
        ) : null}

        <section className="space-y-6">
          {loading ? (
            <LoadingState
              title="Loading Wishlist"
              description="Gathering wishlist books and preparing the shelf view."
              variant="shelf"
              cardCount={8}
            />
          ) : books.length === 0 ? (
            <BookShelfState
              title="No Wishlist Books Yet"
              description="Add the first book you want to track so your wishlist has somewhere to start."
              action={
                <Link to="/admin?add=1&ownership=wishlist" className={actionLinkClasses}>
                  Add Wishlist Book
                </Link>
              }
            />
          ) : filteredBooks.length === 0 ? (
            <BookShelfState
              title="No Matches Found"
              description="Adjust your search or filters to see more wishlist books."
              action={
                <Button type="button" variant="secondary" onClick={clearFilters} className="text-xs">
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
                  actions={
                    <Button
                      type="button"
                      variant="secondary"
                      className={`gap-2 border-sage/20! bg-sage/10! text-sage-dark! hover:border-sage/30! hover:bg-sage/15! active:bg-sage/20! ${
                        state.cardSize === "xsmall"
                          ? "min-h-8 w-auto px-2.5 text-[11px] sm:min-h-9 sm:px-3"
                          : "min-h-10 w-full px-3 sm:w-auto text-xs"
                      }`}
                      disabled={movingBookIds.has(book.id)}
                      onClick={() => void handleMoveToLibrary(book.id)}
                      aria-label={`Move ${book.title} to library`}
                    >
                      <Library className="h-4 w-4" aria-hidden="true" />
                      {movingBookIds.has(book.id)
                        ? "Moving..."
                        : "Move To Library"}
                    </Button>
                  }
                />
              ))}
            </BookGrid>
          )}
        </section>
      </PageLayout>
    </div>
  );
}

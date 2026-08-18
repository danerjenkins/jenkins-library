import { ArrowRight, Library, Star } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { updateBook } from "../../../data/bookRepo";
import { Button } from "../../../ui/components/Button";
import {
  FullBleedPageHero,
  PageLayout,
} from "../../../ui/components/PageLayout";
import { Select } from "../../../ui/components/Select";
import { LoadingState } from "../../../ui/components/LoadingState";
import { BOOK_FORMAT_LABELS, getReadStatus } from "../lib/bookTypes";
import type { Book } from "../lib/bookTypes";
import {
  BookCard,
  BookGrid,
  BookShelfState,
} from "../components/cards/BookCard";
import { FilterDrawer } from "../components/browse/FilterDrawer";
import {
  actionLinkClasses,
  filterFieldGridClasses,
} from "../components/browse/shelfBrowseControlStyles";
import {
  ShelfDisplayToggle,
  ShelfDensitySelector,
  ShelfSearchField,
} from "../components/browse/ShelfBrowseControls";
import { useWishlistShelfBooks } from "../hooks/useShelfBooks";
import {
  getSortedFormats,
  getSortedStrings,
} from "../hooks/useViewBooksPageState";
import {
  groupBooksByGenre,
  matchesBookSearchQuery,
} from "../hooks/discoveryBrowseShared";
import {
  useWishlistPageState,
  wishlistReadFilterOptions,
  type WishlistReadFilter,
} from "../hooks/useWishlistPageState";
import { CARD_SIZE_OPTIONS, type CardSize } from "../lib/shelfViewPreferences";
import { useLibrary } from "../../libraries/useLibrary";

const readStatusByFilter = {
  NEITHER: "neither",
  DANE: "dane",
  EMMA: "emma",
  BOTH: "both",
} as const;

const wishlistActionGridClassesByCardSize: Record<CardSize, string> = {
  xsmall: "grid min-w-0 grid-cols-2 gap-1",
  small: "grid min-w-0 grid-cols-2 gap-1",
  medium: "grid min-w-0 grid-cols-2 gap-1.5",
  large: "grid min-w-0 grid-cols-2 gap-1.5",
};

const wishlistActionButtonSizeClassesByCardSize: Record<CardSize, string> = {
  xsmall: "min-h-8 sm:min-h-9",
  small: "min-h-10",
  medium: "min-h-10",
  large: "min-h-10",
};

function sortWishlistBooks(books: Book[]) {
  return [...books].sort((a, b) => {
    if (a.mostWanted !== b.mostWanted) {
      return a.mostWanted ? -1 : 1;
    }

    const genreCompare = (a.genre ?? "").localeCompare(
      b.genre ?? "",
      undefined,
      {
        sensitivity: "base",
      },
    );
    if (genreCompare !== 0) return genreCompare;

    const authorCompare = a.author.localeCompare(b.author, undefined, {
      sensitivity: "base",
    });
    if (authorCompare !== 0) return authorCompare;

    const seriesCompare = (a.seriesName ?? "").localeCompare(
      b.seriesName ?? "",
      undefined,
      {
        sensitivity: "base",
      },
    );
    if (seriesCompare !== 0) return seriesCompare;

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

function restoreScrollAfterSort(scrollX: number, scrollY: number) {
  requestAnimationFrame(() => {
    window.scrollTo(scrollX, scrollY);
  });
}

export function WishlistPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEdit } = useLibrary();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [movingBookIds, setMovingBookIds] = useState<Set<string>>(new Set());
  const [updatingMostWantedIds, setUpdatingMostWantedIds] = useState<
    Set<string>
  >(new Set());
  const { books, setBooks, loading } = useWishlistShelfBooks();
  const { state, updateState, clearFilters, hasActiveFilters } =
    useWishlistPageState(searchParams, setSearchParams);
  const deferredSearchQuery = useDeferredValue(state.searchQuery);

  const availableGenres = useMemo(
    () => getSortedStrings(books.map((book) => book.genre)),
    [books],
  );
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
        getReadStatus(book) !==
          readStatusByFilter[
            state.filterReadStatus as Exclude<WishlistReadFilter, "ALL">
          ]
      ) {
        return false;
      }

      if (state.filterFormat !== "ALL" && book.format !== state.filterFormat) {
        return false;
      }

      if (state.filterSeries === "NONE") {
        return !book.seriesName;
      }

      if (
        state.filterSeries !== "ALL" &&
        book.seriesName !== state.filterSeries
      ) {
        return false;
      }

      return true;
    });

    return sortWishlistBooks(visibleBooks);
  }, [books, deferredSearchQuery, state]);
  const genreShelfGroups = useMemo(
    () => {
      if (!state.showGenreShelf) {
        return [];
      }

      const mostWantedBooks = filteredBooks.filter((book) => book.mostWanted);
      const remainingBooks = filteredBooks.filter((book) => !book.mostWanted);
      const remainingGroups = groupBooksByGenre(remainingBooks);

      return mostWantedBooks.length > 0
        ? [{ genre: "Most Wanted", books: mostWantedBooks }, ...remainingGroups]
        : remainingGroups;
    },
    [filteredBooks, state.showGenreShelf],
  );

  const handleMoveToLibrary = useCallback(
    async (bookId: string) => {
      if (!canEdit) return;

      const bookToMove = books.find((book) => book.id === bookId);
      if (!bookToMove) return;

      const shouldMove = window.confirm(
        `Move "${bookToMove.title}" to your library?`,
      );
      if (!shouldMove) {
        return;
      }

      setMovingBookIds((current) => new Set(current).add(bookId));
      setBooks((currentBooks) =>
        currentBooks.filter((book) => book.id !== bookId),
      );

      try {
        await updateBook(bookId, { ownershipStatus: "owned" });
      } catch (error) {
        console.error("Failed to move book to library:", error);
        setBooks((currentBooks) =>
          sortWishlistBooks([...currentBooks, bookToMove]),
        );
      } finally {
        setMovingBookIds((current) => {
          const next = new Set(current);
          next.delete(bookId);
          return next;
        });
      }
    },
    [books, canEdit, setBooks],
  );

  const handleToggleMostWanted = useCallback(
    async (bookId: string) => {
      if (!canEdit) return;

      const bookToUpdate = books.find((book) => book.id === bookId);
      if (!bookToUpdate) return;

      const nextMostWanted = !bookToUpdate.mostWanted;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      setUpdatingMostWantedIds((current) => new Set(current).add(bookId));
      setBooks((currentBooks) =>
        sortWishlistBooks(
          currentBooks.map((book) =>
            book.id === bookId
              ? { ...book, mostWanted: nextMostWanted }
              : book,
          ),
        ),
      );
      restoreScrollAfterSort(scrollX, scrollY);

      try {
        await updateBook(bookId, { mostWanted: nextMostWanted });
      } catch (error) {
        console.error("Failed to update most wanted status:", error);
        setBooks((currentBooks) =>
          sortWishlistBooks(
            currentBooks.map((book) =>
              book.id === bookId
                ? { ...book, mostWanted: bookToUpdate.mostWanted }
                : book,
            ),
          ),
        );
      } finally {
        setUpdatingMostWantedIds((current) => {
          const next = new Set(current);
          next.delete(bookId);
          return next;
        });
      }
    },
    [books, canEdit, setBooks],
  );

  const renderWishlistBookCard = (book: Book) => (
    <BookCard
      key={book.id}
      book={book}
      variant="view"
      cardSize={state.cardSize}
      clickable={true}
      showGenreTag={state.showGenreTags}
      showRatingPill={state.showRatings}
      actions={canEdit ? (
        <div className={wishlistActionGridClassesByCardSize[state.cardSize]}>
          <Button
            type="button"
            variant="secondary"
            className={`w-full min-w-0 justify-center px-2! ${
              book.mostWanted
                ? "border-brass/35! bg-brass/20! text-stone-900! hover:border-brass/45! hover:bg-brass/25! active:bg-brass/30!"
                : "border-warm-gray! bg-cream/70! text-stone-600! hover:border-brass/30! hover:bg-brass/10! active:bg-brass/15!"
            } ${wishlistActionButtonSizeClassesByCardSize[state.cardSize]}`}
            disabled={updatingMostWantedIds.has(book.id)}
            onClick={(event) => {
              event.currentTarget.blur();
              void handleToggleMostWanted(book.id);
            }}
            aria-pressed={Boolean(book.mostWanted)}
            aria-label={
              book.mostWanted
                ? `Remove ${book.title} from most wanted`
                : `Mark ${book.title} as most wanted`
            }
            title={
              updatingMostWantedIds.has(book.id)
                ? "Updating..."
                : book.mostWanted
                  ? "Most wanted"
                  : "Mark most wanted"
            }
          >
            <Star
              className={`h-4 w-4 ${book.mostWanted ? "fill-current" : ""}`}
              aria-hidden="true"
            />
          </Button>

          <Button
            type="button"
            variant="secondary"
            className={`w-full min-w-0 justify-center border-sage/20! bg-sage/10! px-2! text-sage-dark! hover:border-sage/30! hover:bg-sage/15! active:bg-sage/20! ${wishlistActionButtonSizeClassesByCardSize[state.cardSize]}`}
            disabled={movingBookIds.has(book.id)}
            onClick={() => void handleMoveToLibrary(book.id)}
            aria-label={`Move ${book.title} to library`}
            title={movingBookIds.has(book.id) ? "Moving..." : "Move to library"}
          >
            <span
              className="relative flex h-4 w-7 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <ArrowRight className="absolute left-0 h-3.5 w-3.5" />
              <Library className="absolute right-0 h-4 w-4" />
            </span>
          </Button>
        </div>
      ) : undefined}
    />
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-transparent">
      <FullBleedPageHero
        title="Wishlist"
        subtitle="A shelf of future favorites and books still making their case."
        backgroundImage="/wishlisthero.png"
      />

      <PageLayout>
        {books.length > 0 ? (
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
                <ShelfDisplayToggle
                  id="wishlist-show-genre-tags"
                  label="Show Genre Tags"
                  checked={state.showGenreTags}
                  onChange={(showGenreTags) => updateState({ showGenreTags })}
                />
                <ShelfDisplayToggle
                  id="wishlist-show-genre-shelf"
                  label="Show Genre Shelf"
                  checked={state.showGenreShelf}
                  onChange={(showGenreShelf) => updateState({ showGenreShelf })}
                />
                <ShelfDisplayToggle
                  id="wishlist-show-ratings"
                  label="Show Ratings"
                  checked={state.showRatings}
                  onChange={(showRatings) => updateState({ showRatings })}
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
                {filteredBooks.length}{" "}
                {filteredBooks.length === 1 ? "book" : "books"} in this view.
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
                onChange={(event) =>
                  updateState({ filterGenre: event.target.value })
                }
                options={[
                  { value: "ALL", label: "All Genres" },
                  ...availableGenres.map((genre) => ({
                    value: genre,
                    label: genre,
                  })),
                ]}
              />

              <Select
                id="wishlist-filter-read"
                label="Read Status"
                value={state.filterReadStatus}
                onChange={(event) =>
                  updateState({
                    filterReadStatus: event.target.value as WishlistReadFilter,
                  })
                }
                options={[...wishlistReadFilterOptions]}
              />

              <Select
                id="wishlist-filter-format"
                label="Format"
                value={state.filterFormat}
                onChange={(event) =>
                  updateState({ filterFormat: event.target.value })
                }
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
                onChange={(event) =>
                  updateState({ filterSeries: event.target.value })
                }
                options={[
                  { value: "ALL", label: "All Series" },
                  { value: "NONE", label: "No Series" },
                  ...availableSeries.map((series) => ({
                    value: series,
                    label: series,
                  })),
                ]}
              />
            </div>
          </FilterDrawer>
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
              action={canEdit ? (
                <Link
                  to="/book/new?ownership=wishlist&returnTo=%2Fwishlist"
                  className={actionLinkClasses}
                >
                  Add Wishlist Book
                </Link>
              ) : undefined}
            />
          ) : filteredBooks.length === 0 ? (
            <BookShelfState
              title="No Matches Found"
              description="Adjust your search or filters to see more wishlist books."
              action={
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <>
              {state.showGenreShelf ? (
                <div className="space-y-6">
                  {genreShelfGroups.map((group) => (
                    <section key={group.genre} className="ds-genre-shelf">
                      <div className="ds-genre-shelf__divider">
                        <h2 className="ds-genre-shelf__label">{group.genre}</h2>
                        <div className="ds-genre-shelf__line" aria-hidden="true" />
                      </div>
                      <BookGrid cardSize={state.cardSize}>
                        {group.books.map(renderWishlistBookCard)}
                      </BookGrid>
                    </section>
                  ))}
                </div>
              ) : (
                <BookGrid cardSize={state.cardSize}>
                  {filteredBooks.map(renderWishlistBookCard)}
                </BookGrid>
              )}
            </>
          )}
        </section>
      </PageLayout>
    </div>
  );
}

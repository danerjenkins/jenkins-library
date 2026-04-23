import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Check, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { getWishlistBooks, updateBook } from "../../data/bookRepo";
import type { Book, BookFormat, ReadStatus } from "./bookTypes";
import { BOOK_FORMAT_LABELS, getReadStatus } from "./bookTypes";
import { BookCard, BookGrid, BookShelfState } from "./components/BookCard";
import { Button } from "../../ui/components/Button";
import { Input } from "../../ui/components/Input";
import { Select } from "../../ui/components/Select";
import {
  CARD_SIZE_OPTIONS,
  type CardSize,
  getDefaultCardSize,
  isCardSize,
  readStorageValue,
  SHELF_CARD_SIZE_STORAGE_KEY,
  WISHLIST_VIEW_STORAGE_KEY,
  writeStorageValue,
} from "./shelfViewPreferences";

type ReadFilter = "ALL" | "NEITHER" | "DANE" | "EMMA" | "BOTH";

const readStatusByFilter: Record<Exclude<ReadFilter, "ALL">, ReadStatus> = {
  NEITHER: "neither",
  DANE: "dane",
  EMMA: "emma",
  BOTH: "both",
};

const readFilterValues = new Set<ReadFilter>([
  "ALL",
  "NEITHER",
  "DANE",
  "EMMA",
  "BOTH",
]);
const actionLinkClasses =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-sage bg-sage px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:border-sage-dark hover:bg-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";

interface StoredWishlistViewPreferences {
  filterGenre: string;
  filterReadStatus: ReadFilter;
  filterFormat: string;
  filterSeries: string;
}

function getStoredWishlistViewPreferences(): StoredWishlistViewPreferences | null {
  const stored = readStorageValue<Partial<StoredWishlistViewPreferences>>(
    WISHLIST_VIEW_STORAGE_KEY,
  );
  if (!stored) {
    return null;
  }

  return {
    filterGenre: stored.filterGenre ?? "ALL",
    filterReadStatus: readFilterValues.has(
      stored.filterReadStatus as ReadFilter,
    )
      ? (stored.filterReadStatus as ReadFilter)
      : "ALL",
    filterFormat: stored.filterFormat ?? "ALL",
    filterSeries: stored.filterSeries ?? "ALL",
  };
}

function sortWishlistBooks(books: Book[]) {
  return [...books].sort((a, b) => {
    const genreCompare = (a.genre ?? "").localeCompare(
      b.genre ?? "",
      undefined,
      { sensitivity: "base" },
    );
    if (genreCompare !== 0) return genreCompare;

    const authorCompare = a.author.localeCompare(b.author, undefined, {
      sensitivity: "base",
    });
    if (authorCompare !== 0) return authorCompare;

    const seriesCompare = (a.seriesName ?? "").localeCompare(
      b.seriesName ?? "",
      undefined,
      { sensitivity: "base" },
    );
    if (seriesCompare !== 0) return seriesCompare;

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

export function WishlistPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingBookIds, setMovingBookIds] = useState<Set<string>>(new Set());
  const [hasHydratedViewState, setHasHydratedViewState] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("ALL");
  const [filterReadStatus, setFilterReadStatus] = useState<ReadFilter>("ALL");
  const [filterFormat, setFilterFormat] = useState("ALL");
  const [filterSeries, setFilterSeries] = useState("ALL");
  const [cardSize, setCardSize] = useState<CardSize>(getDefaultCardSize);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchParamsKey = searchParams.toString();

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const wishlistBooks = await getWishlistBooks();
      setBooks(
        wishlistBooks.filter(
          (book) => (book.ownershipStatus ?? "owned") === "wishlist",
        ),
      );
    } catch (error) {
      console.error("Failed to load wishlist books:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    const storedView = getStoredWishlistViewPreferences();
    const storedCardSize = readStorageValue<string>(SHELF_CARD_SIZE_STORAGE_KEY);
    const queryCardSize = searchParams.get("size");
    const nextCardSize = isCardSize(queryCardSize)
      ? queryCardSize
      : isCardSize(storedCardSize)
        ? storedCardSize
        : getDefaultCardSize();

    const nextSearchQuery = searchParams.get("q") ?? "";
    const nextFilterGenre =
      searchParams.get("genre") ?? storedView?.filterGenre ?? "ALL";
    const queryRead = searchParams.get("read");
    const nextFilterReadStatus = readFilterValues.has(queryRead as ReadFilter)
      ? (queryRead as ReadFilter)
      : storedView?.filterReadStatus ?? "ALL";
    const nextFilterFormat =
      searchParams.get("format") ?? storedView?.filterFormat ?? "ALL";
    const nextFilterSeries =
      searchParams.get("series") ?? storedView?.filterSeries ?? "ALL";

    setSearchQuery((current) =>
      current === nextSearchQuery ? current : nextSearchQuery,
    );
    setFilterGenre((current) =>
      current === nextFilterGenre ? current : nextFilterGenre,
    );
    setFilterReadStatus((current) =>
      current === nextFilterReadStatus ? current : nextFilterReadStatus,
    );
    setFilterFormat((current) =>
      current === nextFilterFormat ? current : nextFilterFormat,
    );
    setFilterSeries((current) =>
      current === nextFilterSeries ? current : nextFilterSeries,
    );
    setCardSize((current) =>
      current === nextCardSize ? current : nextCardSize,
    );
    setHasHydratedViewState(true);
  }, [searchParamsKey, searchParams]);

  useEffect(() => {
    if (!hasHydratedViewState) {
      return;
    }

    writeStorageValue(WISHLIST_VIEW_STORAGE_KEY, {
      filterGenre,
      filterReadStatus,
      filterFormat,
      filterSeries,
    } satisfies StoredWishlistViewPreferences);
    writeStorageValue(SHELF_CARD_SIZE_STORAGE_KEY, cardSize);

    const nextSearchParams = new URLSearchParams();
    if (searchQuery.trim()) {
      nextSearchParams.set("q", searchQuery);
    }
    if (filterGenre !== "ALL") {
      nextSearchParams.set("genre", filterGenre);
    }
    if (filterReadStatus !== "ALL") {
      nextSearchParams.set("read", filterReadStatus);
    }
    if (filterFormat !== "ALL") {
      nextSearchParams.set("format", filterFormat);
    }
    if (filterSeries !== "ALL") {
      nextSearchParams.set("series", filterSeries);
    }
    if (cardSize !== getDefaultCardSize()) {
      nextSearchParams.set("size", cardSize);
    }

    if (nextSearchParams.toString() !== searchParamsKey) {
      startTransition(() => {
        setSearchParams(nextSearchParams, { replace: true });
      });
    }
  }, [
    cardSize,
    filterFormat,
    filterGenre,
    filterReadStatus,
    filterSeries,
    hasHydratedViewState,
    searchParamsKey,
    searchQuery,
    setSearchParams,
  ]);

  const availableGenres = useMemo(
    () =>
      Array.from(
        new Set(
          books
            .map((book) => book.genre)
            .filter((genre): genre is string => Boolean(genre)),
        ),
      ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [books],
  );

  const availableFormats = useMemo(
    () =>
      Array.from(
        new Set(
          books
            .map((book) => book.format)
            .filter((format): format is BookFormat => Boolean(format)),
        ),
      ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [books],
  );

  const availableSeries = useMemo(
    () =>
      Array.from(
        new Set(
          books
            .map((book) => book.seriesName)
            .filter((series): series is string => Boolean(series)),
        ),
      ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [books],
  );

  const filteredBooks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const visibleBooks = books.filter((book) => {
      if (
        query &&
        !book.title.toLowerCase().includes(query) &&
        !book.author.toLowerCase().includes(query)
      ) {
        return false;
      }

      if (filterGenre !== "ALL" && book.genre !== filterGenre) {
        return false;
      }

      if (
        filterReadStatus !== "ALL" &&
        getReadStatus(book) !== readStatusByFilter[filterReadStatus]
      ) {
        return false;
      }

      if (filterFormat !== "ALL" && book.format !== filterFormat) {
        return false;
      }

      if (filterSeries === "NONE") {
        return !book.seriesName;
      }

      if (filterSeries !== "ALL" && book.seriesName !== filterSeries) {
        return false;
      }

      return true;
    });

    return sortWishlistBooks(visibleBooks);
  }, [
    books,
    deferredSearchQuery,
    filterFormat,
    filterGenre,
    filterReadStatus,
    filterSeries,
  ]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    filterGenre !== "ALL" ||
    filterReadStatus !== "ALL" ||
    filterFormat !== "ALL" ||
    filterSeries !== "ALL";

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterGenre("ALL");
    setFilterReadStatus("ALL");
    setFilterFormat("ALL");
    setFilterSeries("ALL");
  }, []);

  const handleMoveToLibrary = useCallback(
    async (bookId: string) => {
      const bookToMove = books.find((book) => book.id === bookId);
      if (!bookToMove) return;

      setMovingBookIds((current) => new Set(current).add(bookId));
      setBooks((currentBooks) =>
        currentBooks.filter((book) => book.id !== bookId),
      );

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
    [books],
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="rounded-lg border border-warm-gray bg-cream/95 p-5 shadow-soft backdrop-blur-sm sm:p-7">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold tracking-tight text-pretty text-stone-900 sm:text-4xl">
              Wishlist
            </h2>
            <p className="font-sans max-w-3xl text-base leading-relaxed text-stone-600">
              Books you want to own, ordered by genre, author, and series.
            </p>
          </div>
          <div className="mt-6 text-sm text-stone-600" aria-live="polite">
            {filteredBooks.length}{" "}
            {filteredBooks.length === 1 ? "book" : "books"}
          </div>

          {books.length > 0 && (
            <div className="mt-4 space-y-3 rounded-lg border border-warm-gray bg-parchment/80 p-3 shadow-sm">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Input
                    id="wishlist-search"
                    name="wishlistSearch"
                    label="Search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Title or author…"
                    autoComplete="off"
                    className="pr-8"
                  />
                  <Search
                    className="pointer-events-none absolute right-2.5 top-8 h-4 w-4 text-stone-400"
                    aria-hidden="true"
                  />
                </div>

                <Select
                  id="wishlist-filter-genre"
                  label="Genre"
                  value={filterGenre}
                  onChange={(event) => setFilterGenre(event.target.value)}
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
                  value={filterReadStatus}
                  onChange={(event) =>
                    setFilterReadStatus(event.target.value as ReadFilter)
                  }
                  options={[
                    { value: "ALL", label: "All" },
                    { value: "NEITHER", label: "To Read" },
                    { value: "DANE", label: "Read by Dane" },
                    { value: "EMMA", label: "Read by Emma" },
                    { value: "BOTH", label: "Read by Both" },
                  ]}
                />

                <Select
                  id="wishlist-filter-format"
                  label="Format"
                  value={filterFormat}
                  onChange={(event) => setFilterFormat(event.target.value)}
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
                  value={filterSeries}
                  onChange={(event) => setFilterSeries(event.target.value)}
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

              <div className="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
                <div className="text-xs text-stone-600" aria-live="polite">
                  Showing {filteredBooks.length} of {books.length}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div
                    className="grid grid-cols-4 rounded-lg border border-warm-gray bg-cream p-1"
                    role="group"
                    aria-label="Card size"
                  >
                  {CARD_SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCardSize(option.value)}
                        className={`min-h-8 rounded-md px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${
                          cardSize === option.value
                            ? "bg-sage text-white"
                            : "text-charcoal/70 hover:bg-warm-gray-light"
                        }`}
                        aria-pressed={cardSize === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClearFilters}
                      className="min-h-8 px-3 text-xs"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          {loading ? (
            <BookShelfState title="Loading Wishlist…" />
          ) : books.length === 0 ? (
            <BookShelfState
              title="No Wishlist Books Yet"
              description="Add the first book you want to track so your wishlist has somewhere to start."
              action={
                <Link
                  to="/admin?add=1&ownership=wishlist"
                  className={actionLinkClasses}
                >
                  Add Wishlist Book
                </Link>
              }
            />
          ) : filteredBooks.length === 0 ? (
            <BookShelfState
              title="No Matches Found"
              description="Adjust your search or filters to see more wishlist books."
              action={
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <BookGrid cardSize={cardSize}>
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant="view"
                  cardSize={cardSize}
                  clickable={true}
                  actions={
                    <Button
                      type="button"
                      variant="success"
                      className="min-h-9 w-full gap-2 text-xs sm:w-auto"
                      disabled={movingBookIds.has(book.id)}
                      onClick={() => void handleMoveToLibrary(book.id)}
                      aria-label={`Move ${book.title} to library`}
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {movingBookIds.has(book.id)
                        ? "Adding To Library…"
                        : "Add To Library"}
                    </Button>
                  }
                />
              ))}
            </BookGrid>
          )}
        </section>
      </div>
    </div>
  );
}

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { getAllBooks, sortBooksBySeriesOrder } from "../../data/bookRepo";
import type { Book, BookFormat, ReadStatus } from "./bookTypes";
import { BOOK_FORMAT_LABELS, getReadStatus } from "./bookTypes";
import { Input } from "../../ui/components/Input";
import { Select } from "../../ui/components/Select";
import { Button } from "../../ui/components/Button";
import { BookCard, BookGrid, BookShelfState } from "./components/BookCard";
import {
  CARD_SIZE_OPTIONS,
  type CardSize,
  getDefaultCardSize,
  isCardSize,
  LIBRARY_VIEW_STORAGE_KEY,
  readStorageValue,
  SHELF_CARD_SIZE_STORAGE_KEY,
  writeStorageValue,
} from "./shelfViewPreferences";

type SortOption = "genre-author" | "series" | "title" | "author" | "updated";
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
const sortOptionValues = new Set<SortOption>([
  "genre-author",
  "series",
  "title",
  "author",
  "updated",
]);
const actionLinkClasses =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-sage bg-sage px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:border-sage-dark hover:bg-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const filterPanelClasses =
  "mt-3 space-y-3 rounded-2xl border border-warm-gray/85 bg-parchment/85 p-3 shadow-sm ring-1 ring-white/40 sm:p-4";
const filterPanelHeaderClasses =
  "flex flex-col gap-3 rounded-xl border border-warm-gray/70 bg-cream/90 p-3 sm:flex-row sm:items-start sm:justify-between";
const filterFieldGridClasses = "grid gap-3 sm:grid-cols-2 lg:grid-cols-6";
const filterMetaRowClasses =
  "flex flex-col items-start justify-between gap-2 rounded-lg border border-transparent px-1 py-0.5 sm:flex-row sm:items-center";
const densityGroupClasses =
  "grid grid-cols-4 rounded-lg border border-warm-gray bg-cream p-0.5 shadow-inner shadow-white/50";
const densityButtonClasses =
  "min-h-11 rounded-md px-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";

interface StoredLibraryViewPreferences {
  filterGenre: string;
  filterFinished: ReadFilter;
  filterFormat: string;
  filterSeries: string;
  sortBy: SortOption;
}

function getStoredLibraryViewPreferences(): StoredLibraryViewPreferences | null {
  const stored = readStorageValue<Partial<StoredLibraryViewPreferences>>(
    LIBRARY_VIEW_STORAGE_KEY,
  );
  if (!stored) {
    return null;
  }

  return {
    filterGenre: stored.filterGenre ?? "ALL",
    filterFinished: readFilterValues.has(stored.filterFinished as ReadFilter)
      ? (stored.filterFinished as ReadFilter)
      : "ALL",
    filterFormat: stored.filterFormat ?? "ALL",
    filterSeries: stored.filterSeries ?? "ALL",
    sortBy: sortOptionValues.has(stored.sortBy as SortOption)
      ? (stored.sortBy as SortOption)
      : "genre-author",
  };
}

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

        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
      }
      case "title":
        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
      case "author":
        return a.author.localeCompare(b.author, undefined, {
          sensitivity: "base",
        });
      case "updated":
        return b.updatedAt - a.updatedAt;
      default:
        return 0;
    }
  });
}

export function ViewBooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHydratedViewState, setHasHydratedViewState] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("ALL");
  const [filterFinished, setFilterFinished] = useState<ReadFilter>("ALL");
  const [filterFormat, setFilterFormat] = useState("ALL");
  const [filterSeries, setFilterSeries] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("genre-author");
  const [cardSize, setCardSize] = useState<CardSize>(getDefaultCardSize);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchParamsKey = searchParams.toString();

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const allBooks = await getAllBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error("Failed to load books:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    const storedView = getStoredLibraryViewPreferences();
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
    const nextFilterFinished = readFilterValues.has(queryRead as ReadFilter)
      ? (queryRead as ReadFilter)
      : storedView?.filterFinished ?? "ALL";
    const nextFilterFormat =
      searchParams.get("format") ?? storedView?.filterFormat ?? "ALL";
    const nextFilterSeries =
      searchParams.get("series") ?? storedView?.filterSeries ?? "ALL";
    const querySort = searchParams.get("sort");
    const nextSortBy = sortOptionValues.has(querySort as SortOption)
      ? (querySort as SortOption)
      : storedView?.sortBy ?? "genre-author";

    setSearchQuery((current) =>
      current === nextSearchQuery ? current : nextSearchQuery,
    );
    setFilterGenre((current) =>
      current === nextFilterGenre ? current : nextFilterGenre,
    );
    setFilterFinished((current) =>
      current === nextFilterFinished ? current : nextFilterFinished,
    );
    setFilterFormat((current) =>
      current === nextFilterFormat ? current : nextFilterFormat,
    );
    setFilterSeries((current) =>
      current === nextFilterSeries ? current : nextFilterSeries,
    );
    setSortBy((current) => (current === nextSortBy ? current : nextSortBy));
    setCardSize((current) =>
      current === nextCardSize ? current : nextCardSize,
    );
    setHasHydratedViewState(true);
  }, [searchParamsKey, searchParams]);

  useEffect(() => {
    if (!hasHydratedViewState) {
      return;
    }

    writeStorageValue(LIBRARY_VIEW_STORAGE_KEY, {
      filterGenre,
      filterFinished,
      filterFormat,
      filterSeries,
      sortBy,
    } satisfies StoredLibraryViewPreferences);
    writeStorageValue(SHELF_CARD_SIZE_STORAGE_KEY, cardSize);

    const nextSearchParams = new URLSearchParams();
    if (searchQuery.trim()) {
      nextSearchParams.set("q", searchQuery);
    }
    if (filterGenre !== "ALL") {
      nextSearchParams.set("genre", filterGenre);
    }
    if (filterFinished !== "ALL") {
      nextSearchParams.set("read", filterFinished);
    }
    if (filterFormat !== "ALL") {
      nextSearchParams.set("format", filterFormat);
    }
    if (filterSeries !== "ALL") {
      nextSearchParams.set("series", filterSeries);
    }
    if (sortBy !== "genre-author") {
      nextSearchParams.set("sort", sortBy);
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
    filterFinished,
    filterFormat,
    filterGenre,
    filterSeries,
    hasHydratedViewState,
    searchParamsKey,
    searchQuery,
    setSearchParams,
    sortBy,
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
    const visible = books.filter((book) => {
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
        filterFinished !== "ALL" &&
        getReadStatus(book) !== readStatusByFilter[filterFinished]
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

    return sortVisibleBooks(visible, sortBy);
  }, [
    books,
    deferredSearchQuery,
    filterFinished,
    filterFormat,
    filterGenre,
    filterSeries,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery ||
    filterGenre !== "ALL" ||
    filterFinished !== "ALL" ||
    filterFormat !== "ALL" ||
    filterSeries !== "ALL" ||
    sortBy !== "genre-author";

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterGenre("ALL");
    setFilterFinished("ALL");
    setFilterFormat("ALL");
    setFilterSeries("ALL");
    setSortBy("genre-author");
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-10">
        <section className="rounded-lg border border-warm-gray bg-cream/95 p-5 shadow-soft backdrop-blur-sm sm:p-7">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold tracking-tight text-pretty text-stone-900 sm:text-4xl">
              My Library
            </h2>
            <p className="font-sans max-w-3xl text-base leading-relaxed text-stone-600">
              Browse and search your personal book collection.
            </p>
          </div>

          <div
            className={filterPanelClasses}
            role="region"
            aria-labelledby="library-filters-heading"
            aria-describedby="library-filters-summary"
          >
            <div className={filterPanelHeaderClasses}>
              <div className="space-y-1">
                <div
                  id="library-filters-heading"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
                >
                  Shelf Filters
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
                  Search the shelf, narrow the catalog, and adjust card density in
                  one place.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div
                  className={densityGroupClasses}
                  role="group"
                  aria-label="Shelf density"
                >
                  {CARD_SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCardSize(option.value)}
                      className={`${densityButtonClasses} ${
                        cardSize === option.value
                          ? "bg-sage text-white shadow-sm"
                          : "text-charcoal/70 hover:bg-warm-gray-light hover:text-charcoal"
                      }`}
                      aria-pressed={cardSize === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="secondary"
                    onClick={handleClearFilters}
                    className="min-h-11 px-3 text-xs"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            <div className={filterFieldGridClasses}>
              <div className="relative sm:col-span-2 lg:col-span-2">
                <Input
                  id="search"
                  name="search"
                  label="Search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Title or author…"
                  autoComplete="off"
                  className="pl-11 pr-10"
                />
                <Search
                  className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-stone-400"
                  aria-hidden="true"
                />
              </div>

              <Select
                id="filter-genre"
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
                id="filter-finished"
                label="Read Status"
                value={filterFinished}
                onChange={(event) =>
                  setFilterFinished(event.target.value as ReadFilter)
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
                id="filter-format"
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
                id="filter-series"
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

              <Select
                id="sort-by"
                label="Sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                options={[
                  { value: "genre-author", label: "Genre then Author" },
                  { value: "series", label: "Series Order" },
                  { value: "title", label: "Title (A-Z)" },
                  { value: "author", label: "Author (A-Z)" },
                  { value: "updated", label: "Recently Updated" },
                ]}
              />
            </div>

            <div className={filterMetaRowClasses}>
              <div
                id="library-filters-summary"
                className="text-xs text-stone-600"
                aria-live="polite"
              >
                {filteredBooks.length}{" "}
                {filteredBooks.length === 1 ? "book" : "books"}
              </div>
              <div className="text-xs text-stone-500">
                Search, filter, and resize your shelf without leaving the page.
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {loading ? (
            <BookShelfState title="Loading Library…" />
          ) : books.length === 0 ? (
            <BookShelfState
              title="No Books Yet"
              description="Start building your library by adding your first owned book."
              action={
                <Link
                  to="/admin?add=1&ownership=owned"
                  className={actionLinkClasses}
                >
                  Add Book
                </Link>
              }
            />
          ) : filteredBooks.length === 0 ? (
            <BookShelfState
              title="No Matches Found"
              description="Adjust your search or clear filters to see the full shelf."
              action={
                <Button
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
                />
              ))}
            </BookGrid>
          )}
        </section>
      </div>
    </div>
  );
}

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
import {
  getAllBooks,
  getWishlistBooks,
  sortBooksBySeriesOrder,
} from "../../data/bookRepo";
import type { Book, BookFormat, ReadStatus } from "./bookTypes";
import { BOOK_FORMAT_LABELS, getReadStatus } from "./bookTypes";
import { Input } from "../../ui/components/Input";
import { Select } from "../../ui/components/Select";
import { Button } from "../../ui/components/Button";
import { BookCard, BookGrid, BookShelfState } from "./components/BookCard";
import { FilterDrawer } from "./components/FilterDrawer";
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
type OwnershipFilter = "owned" | "wishlist" | "all";

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
const ownershipFilterValues = new Set<OwnershipFilter>([
  "owned",
  "wishlist",
  "all",
]);
const actionLinkClasses =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-sage bg-sage px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:border-sage-dark hover:bg-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const filterFieldGridClasses = "grid gap-3";
const densityGroupClasses =
  "grid grid-cols-4 rounded-lg border border-warm-gray bg-cream p-0.5 shadow-inner shadow-white/50";
const densityButtonClasses =
  "min-h-11 rounded-md px-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const segmentedControlClasses =
  "grid grid-cols-1 gap-1 rounded-lg border border-warm-gray bg-cream p-1 shadow-inner shadow-white/50 sm:grid-cols-3";
const segmentedButtonClasses =
  "min-h-11 rounded-md px-4 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const discoveryLinkClasses =
  "group flex min-h-32 flex-col justify-between rounded-2xl border border-warm-gray/80 bg-cream/95 p-4 text-left no-underline shadow-soft transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-sage/55 hover:bg-parchment/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-0 sm:min-h-36 sm:p-5";

interface StoredLibraryViewPreferences {
  ownershipFilter: OwnershipFilter;
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
    ownershipFilter: ownershipFilterValues.has(
      stored.ownershipFilter as OwnershipFilter,
    )
      ? (stored.ownershipFilter as OwnershipFilter)
      : "owned",
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

function mergeShelfBooks(ownedBooks: Book[], wishlistBooks: Book[]) {
  const bookMap = new Map<string, Book>();

  for (const book of [...ownedBooks, ...wishlistBooks]) {
    bookMap.set(book.id, book);
  }

  return Array.from(bookMap.values());
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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("owned");
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
      const [ownedBooks, wishlistBooks] = await Promise.all([
        getAllBooks(),
        getWishlistBooks(),
      ]);
      setBooks(mergeShelfBooks(ownedBooks, wishlistBooks));
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
    const queryOwnership = searchParams.get("ownership");
    const nextOwnershipFilter = ownershipFilterValues.has(
      queryOwnership as OwnershipFilter,
    )
      ? (queryOwnership as OwnershipFilter)
      : storedView?.ownershipFilter ?? "owned";
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
    setOwnershipFilter((current) =>
      current === nextOwnershipFilter ? current : nextOwnershipFilter,
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
      ownershipFilter,
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
    if (ownershipFilter !== "owned") {
      nextSearchParams.set("ownership", ownershipFilter);
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
    ownershipFilter,
    searchParamsKey,
    searchQuery,
    setSearchParams,
    sortBy,
  ]);

  const visibleShelfBooks = useMemo(() => {
    if (ownershipFilter === "all") {
      return books;
    }

    return books.filter(
      (book) => (book.ownershipStatus ?? "owned") === ownershipFilter,
    );
  }, [books, ownershipFilter]);

  const availableGenres = useMemo(
    () =>
      Array.from(
        new Set(
          visibleShelfBooks
            .map((book) => book.genre)
            .filter((genre): genre is string => Boolean(genre)),
        ),
      ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [visibleShelfBooks],
  );

  const availableFormats = useMemo(
    () =>
      Array.from(
        new Set(
          visibleShelfBooks
            .map((book) => book.format)
            .filter((format): format is BookFormat => Boolean(format)),
        ),
      ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [visibleShelfBooks],
  );

  const availableSeries = useMemo(
    () =>
      Array.from(
        new Set(
          visibleShelfBooks
            .map((book) => book.seriesName)
            .filter((series): series is string => Boolean(series)),
        ),
      ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [visibleShelfBooks],
  );
  const noSeriesCount = useMemo(
    () => visibleShelfBooks.filter((book) => !book.seriesName).length,
    [visibleShelfBooks],
  );

  const filteredBooks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const visible = visibleShelfBooks.filter((book) => {
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
    deferredSearchQuery,
    filterFinished,
    filterFormat,
    filterGenre,
    filterSeries,
    sortBy,
    visibleShelfBooks,
  ]);

  const hasActiveFilters =
    searchQuery ||
    ownershipFilter !== "owned" ||
    filterGenre !== "ALL" ||
    filterFinished !== "ALL" ||
    filterFormat !== "ALL" ||
    filterSeries !== "ALL" ||
    sortBy !== "genre-author";

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setOwnershipFilter("owned");
    setFilterGenre("ALL");
    setFilterFinished("ALL");
    setFilterFormat("ALL");
    setFilterSeries("ALL");
    setSortBy("genre-author");
  }, []);

  const shelfLabel =
    ownershipFilter === "wishlist"
      ? "Wishlist"
      : ownershipFilter === "all"
        ? "Library + Wishlist"
        : "Library";
  const visibleSummary = `${filteredBooks.length} ${
    filteredBooks.length === 1 ? "book" : "books"
  }`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-10">
        <section className="rounded-lg border border-warm-gray bg-cream/95 p-5 shadow-soft backdrop-blur-sm sm:p-7">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold tracking-tight text-pretty text-stone-900 sm:text-4xl">
              My Library
            </h2>
            <p className="font-sans max-w-3xl text-base leading-relaxed text-stone-600">
              Browse and search your personal collection, wishlist, or both from
              one shelf.
            </p>
          </div>

          <FilterDrawer
              title="Library Filters"
              description="Search the shelf, switch between library and wishlist views, and adjust browsing density without taking over the page."
              summary={visibleSummary}
              isOpen={isFilterDrawerOpen}
              onOpen={() => setIsFilterDrawerOpen(true)}
              onClose={() => setIsFilterDrawerOpen(false)}
              triggerLabel="Filter Shelf"
              actions={
                <>
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
                  {hasActiveFilters ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClearFilters}
                      className="min-h-11 px-3 text-xs"
                    >
                      Clear Filters
                    </Button>
                  ) : null}
                </>
              }
              footer={
                <div className="text-sm text-stone-600">
                  Search, filter, and resize the {shelfLabel.toLowerCase()} shelf
                  without leaving the page.
                </div>
              }
            >
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
                  className="!pl-11 pr-10"
                />
                <Search
                  className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-stone-400"
                  aria-hidden="true"
                />
              </div>

              <fieldset className="flex min-w-0 flex-col gap-1 sm:col-span-2 lg:col-span-5">
                <legend className="font-sans text-xs font-semibold leading-4 text-stone-700">
                  Shelf
                </legend>
                <div
                  className={segmentedControlClasses}
                  role="group"
                  aria-label="Shelf filter"
                >
                  {[
                    { value: "owned" as const, label: "Library Only" },
                    { value: "wishlist" as const, label: "Wishlist Only" },
                    { value: "all" as const, label: "Library + Wishlist" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      id={`filter-ownership-${option.value}`}
                      type="button"
                      onClick={() => setOwnershipFilter(option.value)}
                      className={`${segmentedButtonClasses} ${
                        ownershipFilter === option.value
                          ? "border border-sage bg-sage text-white shadow-sm"
                          : "border border-transparent bg-transparent text-charcoal/75 hover:bg-warm-gray-light hover:text-charcoal"
                      }`}
                      aria-pressed={ownershipFilter === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

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

          </FilterDrawer>

          <div
            className="mt-4 space-y-3 rounded-2xl border border-warm-gray/75 bg-parchment/80 p-3 shadow-sm ring-1 ring-white/35 sm:p-4"
            role="navigation"
            aria-labelledby="library-discovery-heading"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <h3
                  id="library-discovery-heading"
                  className="font-display text-xl font-semibold tracking-tight text-pretty text-stone-900"
                >
                  Browse Beyond the Shelf
                </h3>
                <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
                  Jump into grouped browsing when you want to scan series order
                  or explore the collection by genre.
                </p>
              </div>
              <div
                className="text-xs font-medium text-stone-500"
                aria-live="polite"
              >
                {loading
                  ? "Loading discovery views…"
                  : `${availableSeries.length} series groups • ${availableGenres.length} genres`}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Link to="/series" className={discoveryLinkClasses}>
                <div className="space-y-2">
                  <div className="inline-flex w-fit rounded-full border border-sage/20 bg-sage/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-dark">
                    Series View
                  </div>
                  <div className="space-y-1">
                    <div className="font-display text-2xl font-semibold tracking-tight text-stone-900 text-pretty">
                      Read in Order
                    </div>
                    <p className="max-w-md text-sm leading-relaxed text-stone-600">
                      Browse complete series stacks, spot gaps quickly, and keep
                      long-running reads in sequence.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-stone-600">
                    {loading
                      ? "Preparing series…"
                      : `${availableSeries.length} series groups`}
                  </span>
                  <span className="font-semibold text-sage-dark transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5">
                    Open Series
                  </span>
                </div>
              </Link>

              <Link to="/genres" className={discoveryLinkClasses}>
                <div className="space-y-2">
                  <div className="inline-flex w-fit rounded-full border border-clay/20 bg-clay/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                    Genre View
                  </div>
                  <div className="space-y-1">
                    <div className="font-display text-2xl font-semibold tracking-tight text-stone-900 text-pretty">
                      Explore by Mood
                    </div>
                    <p className="max-w-md text-sm leading-relaxed text-stone-600">
                      Move through genre shelves, compare categories, and surface
                      titles that fit the kind of read you want next.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-stone-600">
                    {loading
                      ? "Preparing genres…"
                      : `${availableGenres.length} genres • ${noSeriesCount} standalones`}
                  </span>
                  <span className="font-semibold text-clay transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5">
                    Open Genres
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {loading ? (
            <BookShelfState title="Loading Library…" />
          ) : visibleShelfBooks.length === 0 ? (
            <BookShelfState
              title={
                ownershipFilter === "wishlist"
                  ? "No Wishlist Books Yet"
                  : "No Books Yet"
              }
              description={
                ownershipFilter === "wishlist"
                  ? "Add the first wishlist book to start tracking what you want to read next."
                  : ownershipFilter === "all"
                    ? "Start building your shelves by adding books to the library or wishlist."
                    : "Start building your library by adding your first owned book."
              }
              action={
                <Link
                  to={
                    ownershipFilter === "wishlist"
                      ? "/admin?add=1&ownership=wishlist"
                      : "/admin?add=1&ownership=owned"
                  }
                  className={actionLinkClasses}
                >
                  {ownershipFilter === "wishlist"
                    ? "Add Wishlist Book"
                    : "Add Book"}
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

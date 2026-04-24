import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft, ArrowRight, Layers3, Search } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getAllBooks,
  getWishlistBooks,
  sortBooksBySeriesOrder,
} from "../../data/bookRepo";
import type { Book } from "./bookTypes";
import { Input } from "../../ui/components/Input";
import { Select } from "../../ui/components/Select";
import { Button } from "../../ui/components/Button";
import { BookCard, BookShelfState } from "./components/BookCard";
import { FilterDrawer } from "./components/FilterDrawer";
import {
  CARD_SIZE_OPTIONS,
  type CardSize,
  getDefaultCardSize,
} from "./shelfViewPreferences";

type OwnershipFilter = "all" | "owned" | "wishlist";

type SeriesGroup = {
  key: string;
  name: string;
  books: Book[];
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const actionLinkClasses =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-sage bg-sage px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:border-sage-dark hover:bg-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const filterFieldGridClasses = "grid gap-3";
const densityGroupClasses =
  "grid grid-cols-4 rounded-lg border border-warm-gray bg-cream p-0.5 shadow-inner shadow-white/50";
const densityButtonClasses =
  "min-h-11 rounded-md px-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const carouselButtonClasses =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-warm-gray/85 bg-cream/95 text-charcoal shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:border-sage hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

function getScrollBehavior(): ScrollBehavior {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return "auto";
  }

  return "smooth";
}

function getCarouselCardWidthClass(cardSize: CardSize) {
  switch (cardSize) {
    case "xsmall":
      return "w-[8.75rem] sm:w-[9.5rem]";
    case "small":
      return "w-[11.25rem] sm:w-[12rem]";
    case "medium":
      return "w-[13rem] sm:w-[14rem]";
    case "large":
      return "w-[14.5rem] sm:w-[16rem]";
    default:
      return "w-[13rem] sm:w-[14rem]";
  }
}

function normalizeSeriesName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function matchesBookQuery(book: Book, query: string) {
  if (!query) {
    return true;
  }

  return (
    book.title.toLocaleLowerCase().includes(query) ||
    book.author.toLocaleLowerCase().includes(query) ||
    (book.genre ?? "").toLocaleLowerCase().includes(query) ||
    (book.seriesName ?? "").toLocaleLowerCase().includes(query) ||
    (book.seriesLabel ?? "").toLocaleLowerCase().includes(query)
  );
}

function getSeriesProgressLabel(books: Book[]) {
  const orderedBooks = sortBooksBySeriesOrder(books);
  const numberedBooks = orderedBooks.filter(
    (book) => book.seriesSort !== null && book.seriesSort !== undefined,
  );

  if (numberedBooks.length < 2) {
    return `${books.length} ${books.length === 1 ? "book" : "books"}`;
  }

  const first = numberedBooks[0]?.seriesSort;
  const last = numberedBooks[numberedBooks.length - 1]?.seriesSort;

  if (
    first === undefined ||
    first === null ||
    last === undefined ||
    last === null
  ) {
    return `${books.length} ${books.length === 1 ? "book" : "books"}`;
  }

  return `Books ${first}-${last}`;
}

function mergeDiscoveryBooks(ownedBooks: Book[], wishlistBooks: Book[]) {
  const bookMap = new Map<string, Book>();

  for (const book of [...ownedBooks, ...wishlistBooks]) {
    bookMap.set(book.id, book);
  }

  return Array.from(bookMap.values());
}

function SeriesCarouselSkeleton({
  index,
}: {
  index: number;
}) {
  return (
    <section className="rounded-[1.75rem] border border-warm-gray/80 bg-cream/95 p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-4 border-b border-warm-gray/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-full bg-warm-gray-light/90 motion-safe:animate-pulse motion-reduce:animate-none" />
          <div className="h-8 w-52 max-w-full rounded-full bg-warm-gray-light/90 motion-safe:animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-44 max-w-full rounded-full bg-warm-gray-light/75 motion-safe:animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-11 rounded-full bg-warm-gray-light/90 motion-safe:animate-pulse motion-reduce:animate-none" />
          <div className="h-11 w-11 rounded-full bg-warm-gray-light/90 motion-safe:animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
      <div className="mt-4 flex gap-4 overflow-hidden py-1">
        {Array.from({ length: index === 0 ? 4 : 3 }).map((_, cardIndex) => (
          <div
            key={`${index}-${cardIndex}`}
            className="w-[12.5rem] shrink-0 rounded-[1.5rem] border border-warm-gray/70 bg-parchment/75 p-3 shadow-sm sm:w-[14rem]"
          >
            <div className="aspect-[3/4] rounded-[1.1rem] bg-warm-gray-light/90 motion-safe:animate-pulse motion-reduce:animate-none" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-4/5 rounded-full bg-warm-gray-light/90 motion-safe:animate-pulse motion-reduce:animate-none" />
              <div className="h-3.5 w-3/5 rounded-full bg-warm-gray-light/75 motion-safe:animate-pulse motion-reduce:animate-none" />
              <div className="h-3.5 w-1/2 rounded-full bg-warm-gray-light/75 motion-safe:animate-pulse motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type SeriesCarouselSectionProps = {
  group: SeriesGroup;
  cardSize: CardSize;
  registerCarousel: (key: string, node: HTMLDivElement | null) => void;
  onStepCarousel: (key: string, direction: "backward" | "forward") => void;
};

function SeriesCarouselSection({
  group,
  cardSize,
  registerCarousel,
  onStepCarousel,
}: SeriesCarouselSectionProps) {
  const regionId = useId();
  const cardWidthClass = getCarouselCardWidthClass(cardSize);
  const ownedCount = group.books.filter(
    (book) => (book.ownershipStatus ?? "owned") === "owned",
  ).length;
  const wishlistCount = group.books.length - ownedCount;

  return (
    <section
      className="rounded-[1.75rem] border border-warm-gray/80 bg-cream/95 p-4 shadow-soft sm:p-5"
      style={{ contentVisibility: "auto", containIntrinsicSize: "760px" }}
      aria-labelledby={`${regionId}-heading`}
    >
      <div className="flex flex-col gap-4 border-b border-warm-gray/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="inline-flex items-center rounded-full border border-warm-gray/70 bg-parchment/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Reading Order Carousel
          </div>
          <div className="space-y-1">
            <h3
              id={`${regionId}-heading`}
              className="font-display text-2xl font-semibold text-pretty text-stone-900 sm:text-[2rem]"
            >
              {group.name}
            </h3>
            <p className="text-sm leading-relaxed text-stone-600">
              {getSeriesProgressLabel(group.books)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-stone-600">
            <span className="rounded-full border border-warm-gray/75 bg-parchment/80 px-3 py-1">
              {group.books.length} {group.books.length === 1 ? "entry" : "entries"}
            </span>
            <span className="rounded-full border border-warm-gray/75 bg-parchment/80 px-3 py-1">
              {ownedCount} owned
            </span>
            <span className="rounded-full border border-warm-gray/75 bg-parchment/80 px-3 py-1">
              {wishlistCount} wishlist
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={carouselButtonClasses}
              onClick={() => onStepCarousel(group.key, "backward")}
              aria-label={`Scroll ${group.name} backward`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={carouselButtonClasses}
              onClick={() => onStepCarousel(group.key, "forward")}
              aria-label={`Scroll ${group.name} forward`}
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-stone-500 sm:max-w-64 sm:text-right">
            Swipe on touch devices or use the carousel controls to move through
            the reading order.
          </p>
        </div>
      </div>

      <div
        ref={(node) => registerCarousel(group.key, node)}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-visible px-1 pb-3 pr-4 pt-2 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`${group.name} books`}
        role="region"
        aria-roledescription="carousel"
        tabIndex={0}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {group.books.map((book, index) => (
          <div
            key={book.id}
            className={`${cardWidthClass} min-w-0 shrink-0 snap-start`}
            style={{ scrollMarginInline: "1rem" }}
          >
            <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              <span>
                {book.seriesLabel?.trim() || `Book ${index + 1}`}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 ${
                  (book.ownershipStatus ?? "owned") === "wishlist"
                    ? "border-brass/30 bg-brass/10 text-clay"
                    : "border-sage/25 bg-sage/10 text-sage-dark"
                }`}
              >
                {(book.ownershipStatus ?? "owned") === "wishlist"
                  ? "Wishlist"
                  : "Library"}
              </span>
            </div>
            <BookCard
              book={book}
              variant="view"
              cardSize={cardSize}
              clickable={true}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SeriesPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("all");
  const [cardSize, setCardSize] = useState<CardSize>(getDefaultCardSize);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const [ownedBooks, wishlistBooks] = await Promise.all([
        getAllBooks(),
        getWishlistBooks(),
      ]);
      setBooks(mergeDiscoveryBooks(ownedBooks, wishlistBooks));
    } catch (error) {
      console.error("Failed to load books for series browsing:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  const visibleBooks = useMemo(() => {
    if (ownershipFilter === "all") {
      return books;
    }

    return books.filter(
      (book) => (book.ownershipStatus ?? "owned") === ownershipFilter,
    );
  }, [books, ownershipFilter]);

  const standaloneBooks = useMemo(
    () =>
      visibleBooks.filter((book) => {
        const seriesName = book.seriesName?.trim();
        return !seriesName;
      }),
    [visibleBooks],
  );

  const groupedSeries = useMemo(() => {
    const seriesMap = new Map<string, SeriesGroup>();

    for (const book of visibleBooks) {
      const rawSeriesName = book.seriesName?.trim();
      if (!rawSeriesName) {
        continue;
      }

      const key = normalizeSeriesName(rawSeriesName);
      const existingGroup = seriesMap.get(key);

      if (existingGroup) {
        existingGroup.books.push(book);
        continue;
      }

      seriesMap.set(key, {
        key,
        name: rawSeriesName,
        books: [book],
      });
    }

    return Array.from(seriesMap.values())
      .map((group) => ({
        ...group,
        books: sortBooksBySeriesOrder(group.books),
      }))
      .sort((left, right) => collator.compare(left.name, right.name));
  }, [visibleBooks]);

  const filteredSeries = useMemo(() => {
    const query = deferredSearchQuery.trim().toLocaleLowerCase();

    return groupedSeries
      .map((group) => {
        if (!query) {
          return group;
        }

        if (group.name.toLocaleLowerCase().includes(query)) {
          return group;
        }

        const matchingBooks = group.books.filter((book) =>
          matchesBookQuery(book, query),
        );

        if (matchingBooks.length === 0) {
          return null;
        }

        return {
          ...group,
          books: matchingBooks,
        };
      })
      .filter((group): group is SeriesGroup => group !== null);
  }, [deferredSearchQuery, groupedSeries]);

  const seriesBookCount = useMemo(
    () => groupedSeries.reduce((count, group) => count + group.books.length, 0),
    [groupedSeries],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 || ownershipFilter !== "all";
  const resultsSummary = `${filteredSeries.length} series shown`;

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setOwnershipFilter("all");
  }, []);

  const registerCarousel = useCallback(
    (key: string, node: HTMLDivElement | null) => {
      carouselRefs.current[key] = node;
    },
    [],
  );

  const handleStepCarousel = useCallback(
    (key: string, direction: "backward" | "forward") => {
      const carousel = carouselRefs.current[key];
      if (!carousel) {
        return;
      }

      const distance = Math.max(carousel.clientWidth * 0.82, 240);
      carousel.scrollBy({
        left: direction === "forward" ? distance : -distance,
        behavior: getScrollBehavior(),
      });
    },
    [],
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-10">
        <section className="rounded-lg border border-warm-gray bg-cream/95 p-5 shadow-soft backdrop-blur-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-warm-gray/80 bg-parchment/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
                <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
                Search And Discovery
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-pretty text-stone-900 sm:text-4xl">
                Series Browser
              </h2>
              <p className="max-w-3xl text-base leading-relaxed text-stone-600">
                Browse the catalog by series, keep the reading order visible,
                and jump straight into each book from a grouped shelf view.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-warm-gray/75 bg-parchment/85 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Series
                </div>
                <div className="mt-1 font-display text-2xl font-semibold text-stone-900">
                  {groupedSeries.length}
                </div>
              </div>
              <div className="rounded-xl border border-warm-gray/75 bg-parchment/85 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  In Series
                </div>
                <div className="mt-1 font-display text-2xl font-semibold text-stone-900">
                  {seriesBookCount}
                </div>
              </div>
              <div className="col-span-2 rounded-xl border border-warm-gray/75 bg-parchment/85 px-4 py-3 sm:col-span-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Standalone
                </div>
                <div className="mt-1 font-display text-2xl font-semibold text-stone-900">
                  {standaloneBooks.length}
                </div>
              </div>
            </div>
          </div>

          <FilterDrawer
              title="Series Filters"
              description="Search by series, title, author, or genre and keep density adjustable for longer reading-order scans."
              summary={resultsSummary}
              isOpen={isFilterDrawerOpen}
              onOpen={() => setIsFilterDrawerOpen(true)}
              onClose={() => setIsFilterDrawerOpen(false)}
              triggerLabel="Filter Series"
              actions={
                <>
                  <div
                    className={densityGroupClasses}
                    role="group"
                    aria-label="Series shelf density"
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
                  Books without a series stay out of the grouped shelf and are summarized separately.
                </div>
              }
            >
            <div className={filterFieldGridClasses}>
              <div className="relative">
                <Input
                  id="series-search"
                  name="series-search"
                  label="Search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Series, title, author, or genre…"
                  autoComplete="off"
                  className="!pl-11 pr-10"
                />
                <Search
                  className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-stone-400"
                  aria-hidden="true"
                />
              </div>

              <Select
                id="series-ownership"
                label="Shelf"
                value={ownershipFilter}
                onChange={(event) =>
                  setOwnershipFilter(event.target.value as OwnershipFilter)
                }
                options={[
                  { value: "all", label: "Owned + Wishlist" },
                  { value: "owned", label: "Owned Only" },
                  { value: "wishlist", label: "Wishlist Only" },
                ]}
              />
            </div>

          </FilterDrawer>
        </section>

        {standaloneBooks.length > 0 && (
          <section className="rounded-2xl border border-warm-gray/80 bg-parchment/80 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="font-display text-xl font-semibold text-stone-900">
                  Standalone Summary
                </h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  {standaloneBooks.length}{" "}
                  {standaloneBooks.length === 1 ? "book is" : "books are"} not
                  attached to a series and therefore excluded from the grouped
                  results.
                </p>
              </div>
              <Link to="/view?series=NONE" className={actionLinkClasses}>
                View Standalones
              </Link>
            </div>
          </section>
        )}

        <section className="space-y-4">
          {loading ? (
            <div aria-live="polite" aria-label="Loading series">
              <div className="sr-only">Loading series…</div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SeriesCarouselSkeleton key={index} index={index} />
                ))}
              </div>
            </div>
          ) : groupedSeries.length === 0 ? (
            <BookShelfState
              title="No Series Yet"
              description={
                standaloneBooks.length > 0
                  ? `${standaloneBooks.length} standalone ${
                      standaloneBooks.length === 1 ? "book is" : "books are"
                    } already in the catalog, but nothing is grouped into a series yet.`
                  : "Assign books to a series in Manage to start browsing by reading order."
              }
              action={
                <Link to="/admin" className={actionLinkClasses}>
                  Open Manage
                </Link>
              }
            />
          ) : filteredSeries.length === 0 ? (
            <BookShelfState
              title="No Matching Series"
              description="Try a different search or clear the shelf filter to return to the full series list."
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
            filteredSeries.map((group) => (
              <SeriesCarouselSection
                key={group.key}
                group={group}
                cardSize={cardSize}
                registerCarousel={registerCarousel}
                onStepCarousel={handleStepCarousel}
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

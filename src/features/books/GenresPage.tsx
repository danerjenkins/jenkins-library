import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Library,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getAllBooks,
  getWishlistBooks,
  sortBooksBySeriesOrder,
} from "../../data/bookRepo";
import { Button } from "../../ui/components/Button";
import { Input } from "../../ui/components/Input";
import type { Book } from "./bookTypes";
import { BookCard, BookShelfState } from "./components/BookCard";
import {
  CARD_SIZE_OPTIONS,
  type CardSize,
  getDefaultCardSize,
  isCardSize,
  readStorageValue,
  SHELF_CARD_SIZE_STORAGE_KEY,
  writeStorageValue,
} from "./shelfViewPreferences";

type OwnershipFilter = "all" | "owned" | "wishlist";

type GenreShelf = {
  genre: string;
  sectionId: string;
  books: Book[];
  ownedCount: number;
  wishlistCount: number;
};

const ownershipOptions: Array<{ value: OwnershipFilter; label: string }> = [
  { value: "all", label: "All Books" },
  { value: "owned", label: "Library Only" },
  { value: "wishlist", label: "Wishlist Only" },
];

const sectionSurfaceClasses =
  "rounded-[1.5rem] border border-warm-gray/85 bg-parchment/85 shadow-sm ring-1 ring-white/40";
const pillClasses =
  "inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]";
const densityGroupClasses =
  "grid grid-cols-4 rounded-lg border border-warm-gray bg-cream p-0.5 shadow-inner shadow-white/50";
const densityButtonClasses =
  "min-h-11 rounded-md px-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const carouselButtonClasses =
  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-warm-gray/80 bg-parchment text-stone-700 shadow-sm transition-[transform,background-color,border-color,color,box-shadow] duration-150 hover:-translate-y-px hover:border-sage-light hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/45 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0";

function normalizeGenre(genre?: string | null) {
  const trimmed = genre?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Uncategorized";
}

function toSectionId(genre: string) {
  return `genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function matchesSearch(book: Book, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    book.title,
    book.author,
    book.genre,
    book.seriesName,
    book.seriesLabel,
    book.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function sortGenreShelfBooks(books: Book[]) {
  const bySeries = sortBooksBySeriesOrder([...books]);

  return bySeries.sort((a, b) => {
    const genreA = normalizeGenre(a.genre);
    const genreB = normalizeGenre(b.genre);
    const genreCompare = genreA.localeCompare(genreB, undefined, {
      sensitivity: "base",
    });
    if (genreCompare !== 0) {
      return genreCompare;
    }

    const authorCompare = a.author.localeCompare(b.author, undefined, {
      sensitivity: "base",
    });
    if (authorCompare !== 0) {
      return authorCompare;
    }

    const seriesCompare = (a.seriesName ?? "").localeCompare(
      b.seriesName ?? "",
      undefined,
      { sensitivity: "base" },
    );
    if (seriesCompare !== 0) {
      return seriesCompare;
    }

    const seriesOrderA = a.seriesSort ?? Number.POSITIVE_INFINITY;
    const seriesOrderB = b.seriesSort ?? Number.POSITIVE_INFINITY;
    if (seriesOrderA !== seriesOrderB) {
      return seriesOrderA - seriesOrderB;
    }

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

function getCarouselCardWidthClass(cardSize: CardSize) {
  switch (cardSize) {
    case "xsmall":
      return "w-[9rem] sm:w-[9.75rem]";
    case "small":
      return "w-[11.75rem] sm:w-[12.5rem]";
    case "medium":
      return "w-[13.75rem] sm:w-[14.75rem]";
    case "large":
      return "w-[15.25rem] sm:w-[16.5rem]";
    default:
      return "w-[11.75rem] sm:w-[12.5rem]";
  }
}

function mergeDiscoveryBooks(ownedBooks: Book[], wishlistBooks: Book[]) {
  const bookMap = new Map<string, Book>();

  for (const book of [...ownedBooks, ...wishlistBooks]) {
    bookMap.set(book.id, book);
  }

  return Array.from(bookMap.values());
}

function getScrollBehavior() {
  if (typeof window === "undefined") {
    return "auto" satisfies ScrollBehavior;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function LoadingShelfSkeleton({ index }: { index: number }) {
  return (
    <section
      className={`${sectionSurfaceClasses} p-4 sm:p-5`}
      aria-hidden="true"
      style={{ contentVisibility: "auto", containIntrinsicSize: "520px" }}
    >
      <div className="rounded-[1.6rem] border border-warm-gray/75 bg-cream/90 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-4 w-24 rounded-full bg-warm-gray/60 motion-safe:animate-pulse motion-reduce:animate-none" />
            <div className="h-8 w-48 rounded-full bg-warm-gray/70 motion-safe:animate-pulse motion-reduce:animate-none" />
            <div className="h-4 w-full max-w-xl rounded-full bg-warm-gray/55 motion-safe:animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-10 rounded-full bg-warm-gray/60 motion-safe:animate-pulse motion-reduce:animate-none" />
            <div className="h-10 w-10 rounded-full bg-warm-gray/60 motion-safe:animate-pulse motion-reduce:animate-none" />
          </div>
        </div>

        <div className="mt-5 flex gap-4 overflow-hidden pb-1">
          {Array.from({ length: index % 2 === 0 ? 4 : 5 }).map((_, cardIndex) => (
            <div
              key={cardIndex}
              className="flex w-[14.5rem] shrink-0 snap-start flex-col gap-3 rounded-[1.4rem] border border-warm-gray/65 bg-parchment/95 p-3 shadow-sm"
            >
              <div className="aspect-[3/4] rounded-[1.1rem] bg-warm-gray/55 motion-safe:animate-pulse motion-reduce:animate-none" />
              <div className="h-4 w-3/4 rounded-full bg-warm-gray/65 motion-safe:animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-2/3 rounded-full bg-warm-gray/55 motion-safe:animate-pulse motion-reduce:animate-none" />
              <div className="flex gap-2">
                <div className="h-7 w-20 rounded-full bg-warm-gray/55 motion-safe:animate-pulse motion-reduce:animate-none" />
                <div className="h-7 w-16 rounded-full bg-warm-gray/45 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GenresPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");
  const [cardSize, setCardSize] = useState<CardSize>(getDefaultCardSize);
  const [shelfCardHeights, setShelfCardHeights] = useState<Record<string, number>>({});
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const heightSyncFrameRef = useRef<number | null>(null);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const [ownedBooks, wishlistBooks] = await Promise.all([
        getAllBooks(),
        getWishlistBooks(),
      ]);
      setBooks(mergeDiscoveryBooks(ownedBooks, wishlistBooks));
    } catch (error) {
      console.error("Failed to load books for genres page:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    const storedCardSize = readStorageValue<string>(SHELF_CARD_SIZE_STORAGE_KEY);
    if (isCardSize(storedCardSize)) {
      setCardSize((current) => (current === storedCardSize ? current : storedCardSize));
    }
  }, []);

  useEffect(() => {
    writeStorageValue(SHELF_CARD_SIZE_STORAGE_KEY, cardSize);
  }, [cardSize]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return books.filter((book) => {
      const ownershipStatus = book.ownershipStatus ?? "owned";
      if (ownershipFilter !== "all" && ownershipStatus !== ownershipFilter) {
        return false;
      }

      return matchesSearch(book, normalizedQuery);
    });
  }, [books, deferredSearchQuery, ownershipFilter]);

  const genreShelves = useMemo<GenreShelf[]>(() => {
    const grouped = new Map<string, Book[]>();

    for (const book of filteredBooks) {
      const genre = normalizeGenre(book.genre);
      const existing = grouped.get(genre);
      if (existing) {
        existing.push(book);
      } else {
        grouped.set(genre, [book]);
      }
    }

    return [...grouped.entries()]
      .map(([genre, genreBooks]) => {
        const sortedBooks = sortGenreShelfBooks(genreBooks);
        const ownedCount = sortedBooks.filter(
          (book) => (book.ownershipStatus ?? "owned") === "owned",
        ).length;

        return {
          genre,
          sectionId: toSectionId(genre),
          books: sortedBooks,
          ownedCount,
          wishlistCount: sortedBooks.length - ownedCount,
        };
      })
      .sort((a, b) => {
        if (b.books.length !== a.books.length) {
          return b.books.length - a.books.length;
        }

        return a.genre.localeCompare(b.genre, undefined, { sensitivity: "base" });
      });
  }, [filteredBooks]);

  const featuredShelves = useMemo(() => genreShelves.slice(0, 6), [genreShelves]);
  const ownershipTotals = useMemo(
    () => ({
      owned: filteredBooks.filter((book) => (book.ownershipStatus ?? "owned") === "owned")
        .length,
      wishlist: filteredBooks.filter(
        (book) => (book.ownershipStatus ?? "owned") === "wishlist",
      ).length,
    }),
    [filteredBooks],
  );

  const resultsLabel = useMemo(() => {
    if (loading) {
      return "Loading shelves…";
    }

    const genreCount = genreShelves.length;
    const bookCount = filteredBooks.length;
    const noun = bookCount === 1 ? "book" : "books";
    const genreNoun = genreCount === 1 ? "genre shelf" : "genre shelves";

    return `${bookCount} ${noun} across ${genreCount} ${genreNoun}`;
  }, [filteredBooks.length, genreShelves.length, loading]);

  const scrollShelf = useCallback((sectionId: string, direction: "backward" | "forward") => {
    const shelf = carouselRefs.current[sectionId];
    if (!shelf) {
      return;
    }

    const viewportWidth = shelf.clientWidth;
    const delta = Math.max(viewportWidth * 0.82, 240) * (direction === "forward" ? 1 : -1);

    shelf.scrollBy({
      left: delta,
      behavior: getScrollBehavior(),
    });
  }, []);

  const syncShelfCardHeights = useCallback(() => {
    const nextHeights: Record<string, number> = {};

    for (const shelf of genreShelves) {
      const carousel = carouselRefs.current[shelf.sectionId];
      if (!carousel) {
        continue;
      }

      const cardItems = carousel.querySelectorAll<HTMLElement>("[data-genre-card-item]");
      if (cardItems.length === 0) {
        continue;
      }

      cardItems.forEach((item) => {
        item.style.height = "";
      });

      let maxHeight = 0;
      cardItems.forEach((item) => {
        const card = item.querySelector<HTMLElement>(".book-card");
        const measuredHeight = Math.ceil((card ?? item).getBoundingClientRect().height);
        if (measuredHeight > maxHeight) {
          maxHeight = measuredHeight;
        }
      });

      if (maxHeight > 0) {
        nextHeights[shelf.sectionId] = maxHeight;
      }
    }

    setShelfCardHeights((current) => {
      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(nextHeights);
      if (currentKeys.length === nextKeys.length) {
        const isSame = nextKeys.every((key) => current[key] === nextHeights[key]);
        if (isSame) {
          return current;
        }
      }

      return nextHeights;
    });
  }, [genreShelves]);

  const scheduleShelfCardHeightSync = useCallback(() => {
    if (typeof window === "undefined") {
      syncShelfCardHeights();
      return;
    }

    if (heightSyncFrameRef.current !== null) {
      window.cancelAnimationFrame(heightSyncFrameRef.current);
    }

    heightSyncFrameRef.current = window.requestAnimationFrame(() => {
      heightSyncFrameRef.current = null;
      syncShelfCardHeights();
    });
  }, [syncShelfCardHeights]);

  useEffect(() => {
    scheduleShelfCardHeightSync();

    if (typeof ResizeObserver === "undefined") {
      return () => {
        if (typeof window !== "undefined" && heightSyncFrameRef.current !== null) {
          window.cancelAnimationFrame(heightSyncFrameRef.current);
          heightSyncFrameRef.current = null;
        }
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleShelfCardHeightSync();
    });

    for (const shelf of genreShelves) {
      const carousel = carouselRefs.current[shelf.sectionId];
      if (!carousel) {
        continue;
      }

      resizeObserver.observe(carousel);
      carousel
        .querySelectorAll<HTMLElement>("[data-genre-card-item]")
        .forEach((item) => resizeObserver.observe(item));
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", scheduleShelfCardHeightSync);
    }

    return () => {
      resizeObserver.disconnect();
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", scheduleShelfCardHeightSync);
        if (heightSyncFrameRef.current !== null) {
          window.cancelAnimationFrame(heightSyncFrameRef.current);
          heightSyncFrameRef.current = null;
        }
      }
    };
  }, [genreShelves, cardSize, scheduleShelfCardHeightSync]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <header className={`${sectionSurfaceClasses} overflow-hidden`}>
        <div className="relative px-5 py-5 sm:px-6 sm:py-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(184,138,69,0.18),_transparent_36%),radial-gradient(circle_at_78%_22%,_rgba(111,132,99,0.14),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.3),_rgba(255,255,255,0))]"
            aria-hidden="true"
          />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.95fr)] lg:items-stretch">
            <div className="rounded-[1.9rem] border border-white/60 bg-cream/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:p-6">
              <span className={`${pillClasses} border-brass/40 bg-brass/10 text-brass shadow-sm`}>
                <Compass className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Browse by Genre
              </span>
              <div className="mt-4 max-w-3xl space-y-3">
                <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[0.95] tracking-[-0.03em] text-stone-900 sm:text-5xl">
                  Genre shelves for quick discovery
                </h1>
                <p className="max-w-2xl text-base leading-8 text-stone-700">
                  Scan the collection by mood, lane, and reading intent without replacing
                  the main library view.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-stone-600">
                <span className="inline-flex min-h-10 items-center rounded-full border border-warm-gray/80 bg-parchment/85 px-4 font-semibold text-stone-800 shadow-sm">
                  {resultsLabel}
                </span>
                <span className="max-w-xl">
                  Jump into the busiest genres first, then refine the shelves below.
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.6rem] border border-warm-gray/75 bg-cream/92 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Total Shelves
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="font-display text-4xl font-semibold leading-none text-stone-900">
                    {loading ? "…" : genreShelves.length}
                  </p>
                  <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                    grouped lanes
                  </p>
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-sage/20 bg-[linear-gradient(180deg,rgba(111,132,99,0.12),rgba(111,132,99,0.04))] px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage-dark/80">
                  Library
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="font-display text-4xl font-semibold leading-none text-stone-900">
                    {loading ? "…" : ownershipTotals.owned}
                  </p>
                  <p className="text-xs uppercase tracking-[0.14em] text-sage-dark/75">
                    owned books
                  </p>
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-brass/30 bg-[linear-gradient(180deg,rgba(184,138,69,0.12),rgba(184,138,69,0.04))] px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay/85">
                  Wishlist
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="font-display text-4xl font-semibold leading-none text-stone-900">
                    {loading ? "…" : ownershipTotals.wishlist}
                  </p>
                  <p className="text-xs uppercase tracking-[0.14em] text-clay/80">
                    saved titles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className={`${sectionSurfaceClasses} p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 rounded-2xl border border-warm-gray/70 bg-cream/90 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Search And Filter
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-stone-900">
                Narrow the shelves
              </h2>
              <p className="mt-1 text-sm text-stone-600">{resultsLabel}</p>
            </div>
            <Link
              to="/view"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-warm-gray bg-parchment px-3.5 py-2 text-sm font-semibold text-stone-800 no-underline shadow-sm transition-[background-color,border-color,color,box-shadow] duration-150 hover:border-sage-light hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Back to Library
            </Link>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-[2.15rem] left-3 h-4 w-4 text-stone-400"
                aria-hidden="true"
              />
              <Input
                id="genres-search"
                name="genres-search"
                type="search"
                label="Search titles, authors, genres, or series"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Try fantasy, Sanderson, murder mystery, or novella…"
                autoComplete="off"
                className="!pl-11 pr-10"
              />
            </div>

            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold leading-4 text-stone-700">
                Ownership
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {ownershipOptions.map((option) => {
                  const isActive = ownershipFilter === option.value;

                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={isActive ? "primary" : "secondary"}
                      onClick={() => setOwnershipFilter(option.value)}
                      className="w-full"
                      aria-pressed={isActive}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-stone-500">
              Keep the same shelf density controls here and browse sideways instead
              of vertically.
            </div>
            <div className={densityGroupClasses} role="group" aria-label="Genre shelf density">
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
          </div>
        </div>
      </section>

      {featuredShelves.length > 0 && (
        <section className={`${sectionSurfaceClasses} p-4 sm:p-5`}>
          <div className="flex flex-col gap-4 rounded-2xl border border-warm-gray/70 bg-cream/90 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Featured Shelves
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-stone-900">
                  Start with the busiest genres
                </h2>
              </div>
              <p className="text-sm text-stone-600">
                Quick links for the shelves with the most books right now.
              </p>
            </div>
            <nav className="flex flex-wrap gap-2" aria-label="Featured genre shelf jumps">
              {featuredShelves.map((shelf) => (
                <a
                  key={shelf.sectionId}
                  href={`#${shelf.sectionId}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-warm-gray bg-parchment px-4 py-2 text-sm font-semibold text-stone-800 no-underline shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-sage-light hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                >
                  {shelf.genre}
                  <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-stone-500">
                    {shelf.books.length}
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </section>
      )}

      {loading ? (
        <div
          className="space-y-5"
          role="status"
          aria-live="polite"
          aria-label="Loading genre carousels"
        >
          <BookShelfState
            title="Loading genre carousels"
            description="Pulling the latest books into browseable genre lanes."
          />
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingShelfSkeleton key={index} index={index} />
          ))}
        </div>
      ) : genreShelves.length === 0 ? (
        <BookShelfState
          title="No shelves match this view"
          description="Try widening the search or switching the ownership filter."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearchQuery("");
                setOwnershipFilter("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {genreShelves.map((shelf) => (
            <section
              key={shelf.sectionId}
              id={shelf.sectionId}
              className={`${sectionSurfaceClasses} scroll-mt-24 p-4 sm:p-5`}
            >
              <div className="rounded-[1.6rem] border border-warm-gray/70 bg-cream/90 p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Genre Lane
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl font-semibold text-stone-900 text-balance">
                        {shelf.genre}
                      </h2>
                      <span
                        className={`${pillClasses} border-warm-gray bg-parchment text-stone-600`}
                      >
                        {shelf.books.length} {shelf.books.length === 1 ? "book" : "books"}
                      </span>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-stone-600">
                      Swipe or arrow through this lane to compare ownership, scan related reads,
                      and keep series-adjacent picks together.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <span className="inline-flex min-h-9 items-center rounded-full border border-sage/25 bg-sage/10 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-sage-dark">
                      <Library className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      {shelf.ownedCount} in library
                    </span>
                    <span className="inline-flex min-h-9 items-center rounded-full border border-brass/30 bg-brass/10 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-clay">
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      {shelf.wishlistCount} on wishlist
                    </span>
                    <div className="ml-auto flex items-center gap-2 md:ml-2">
                      <button
                        type="button"
                        className={`${carouselButtonClasses} touch-manipulation`}
                        onClick={() => scrollShelf(shelf.sectionId, "backward")}
                        aria-label={`Scroll ${shelf.genre} books backward`}
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`${carouselButtonClasses} touch-manipulation`}
                        onClick={() => scrollShelf(shelf.sectionId, "forward")}
                        aria-label={`Scroll ${shelf.genre} books forward`}
                      >
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  ref={(node) => {
                    carouselRefs.current[shelf.sectionId] = node;
                  }}
                  className="mt-4 flex items-start snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible px-1 pb-2 pr-4 pt-1 touch-pan-x focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/45 focus-visible:ring-offset-2 focus-visible:ring-offset-cream [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
                  aria-label={`${shelf.genre} book carousel`}
                  role="region"
                  aria-roledescription="carousel"
                  tabIndex={0}
                  style={{
                    contentVisibility: "auto",
                    containIntrinsicSize: "420px",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {shelf.books.map((book) => {
                    const cardWidthClass = getCarouselCardWidthClass(cardSize);

                    return (
                      <div
                        key={book.id}
                        className={`${cardWidthClass} flex min-w-0 shrink-0 snap-start`}
                        data-genre-card-item
                        style={{
                          height: shelfCardHeights[shelf.sectionId]
                            ? `${shelfCardHeights[shelf.sectionId]}px`
                            : undefined,
                          scrollMarginInline: "1rem",
                        }}
                      >
                        <BookCard
                          key={book.id}
                          book={book}
                          variant="view"
                          cardSize={cardSize}
                          clickable={true}
                          deferRendering={false}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 border-t border-warm-gray/60 pt-2.5">
                  <p className="min-w-0 text-sm text-stone-600">
                    <span className="font-semibold text-stone-800">{shelf.genre}</span> keeps{" "}
                    {shelf.books.length} responsive cards in a horizontal browse lane for quicker
                    scanning on mobile and desktop.
                  </p>
                  <a
                    href={`#${shelf.sectionId}`}
                    className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-warm-gray bg-parchment px-4 py-2 text-sm font-semibold text-stone-800 no-underline transition-[background-color,border-color,color,box-shadow] duration-150 hover:border-sage-light hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/45 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                  >
                    Back to Shelf Start
                  </a>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Search } from "lucide-react";
import { getAllBooks, sortBooksBySeriesOrder } from "../../data/bookRepo";
import type { Book, BookFormat, ReadStatus } from "./bookTypes";
import { BOOK_FORMAT_LABELS, getReadStatus } from "./bookTypes";
import { Input } from "../../ui/components/Input";
import { Select } from "../../ui/components/Select";
import { Button } from "../../ui/components/Button";
import { BookCard, BookGrid, BookShelfState } from "./components/BookCard";

type SortOption = "genre-author" | "series" | "title" | "author" | "updated";
type ReadFilter = "ALL" | "NEITHER" | "DANE" | "EMMA" | "BOTH";
type CardSize = "xsmall" | "small" | "medium" | "large";

const readStatusByFilter: Record<Exclude<ReadFilter, "ALL">, ReadStatus> = {
  NEITHER: "neither",
  DANE: "dane",
  EMMA: "emma",
  BOTH: "both",
};

const sizeOptions: Array<{ value: CardSize; label: string }> = [
  { value: "xsmall", label: "XS" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

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
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("ALL");
  const [filterFinished, setFilterFinished] = useState<ReadFilter>("ALL");
  const [filterFormat, setFilterFormat] = useState("ALL");
  const [filterSeries, setFilterSeries] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("genre-author");
  const [cardSize, setCardSize] = useState<CardSize>("medium");
  const deferredSearchQuery = useDeferredValue(searchQuery);

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
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="rounded-lg border border-warm-gray bg-cream/95 p-5 shadow-soft backdrop-blur-sm sm:p-7">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold tracking-tight text-pretty text-stone-900 sm:text-4xl">
              My Library
            </h2>
            <p className="font-sans max-w-3xl text-base leading-relaxed text-stone-600">
              Browse and search your personal book collection.
            </p>
          </div>

          <div className="mt-3 space-y-2 rounded-lg border border-warm-gray bg-parchment/80 p-2.5 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
              <div className="relative sm:col-span-3 lg:col-span-2">
                <Input
                  id="search"
                  name="search"
                  label="Search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Title or author…"
                  autoComplete="off"
                  className="pr-9"
                />
                <Search
                  className="pointer-events-none absolute right-2.5 top-8 h-4 w-4 text-stone-400"
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

            <div className="flex flex-col items-stretch justify-between gap-1.5 sm:flex-row sm:items-center">
              <div className="text-xs text-stone-600" aria-live="polite">
                {filteredBooks.length}{" "}
                {filteredBooks.length === 1 ? "book" : "books"}
              </div>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                <div
                  className="grid grid-cols-4 rounded-md border border-warm-gray bg-cream p-0.5"
                  role="group"
                  aria-label="Card size"
                >
                  {sizeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCardSize(option.value)}
                      className={`min-h-7 rounded px-2 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${
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
                    variant="secondary"
                    onClick={handleClearFilters}
                    className="min-h-7 px-2.5 text-[11px]"
                  >
                    Clear Filters
                  </Button>
                )}
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
              description="Start building your library by adding books from Manage."
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

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getAllBooks, updateBook } from "../../data/bookRepo";
import type { Book } from "./bookTypes";
import { Input } from "../../ui/components/Input";
import { Select } from "../../ui/components/Select";
import { Button } from "../../ui/components/Button";
import { BookCard } from "./components/BookCard";

type SortOption = "title" | "author" | "updated";

export function ViewBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("ALL");
  const [filterFinished, setFilterFinished] = useState<
    "ALL" | "FINISHED" | "UNFINISHED"
  >("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("title");

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    try {
      setLoading(true);
      const allBooks = await getAllBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error("Failed to load books:", error);
    } finally {
      setLoading(false);
    }
  }

  // Derive available genres from books
  const availableGenres = Array.from(
    new Set(
      books
        .map((b) => b.genre)
        .filter((g): g is string => g !== null && g !== undefined),
    ),
  ).sort();

  // Filter books based on search and filter state
  let filteredBooks = books.filter((book) => {
    // Search filter: case-insensitive match on title or author
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Genre filter
    if (filterGenre !== "ALL" && book.genre !== filterGenre) {
      return false;
    }

    // Finished filter
    if (filterFinished === "FINISHED" && !book.finished) {
      return false;
    }
    if (filterFinished === "UNFINISHED" && book.finished) {
      return false;
    }

    return true;
  });

  // Sort books
  filteredBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "author":
        return a.author.localeCompare(b.author);
      case "updated":
        return b.updatedAt - a.updatedAt;
      default:
        return 0;
    }
  });

  const handleToggleFinished = async (
    bookId: string,
    currentFinished: boolean,
  ) => {
    try {
      // Optimistically update UI
      setBooks((prevBooks) =>
        prevBooks.map((book) =>
          book.id === bookId
            ? { ...book, finished: !currentFinished }
            : book,
        ),
      );

      // Update database
      await updateBook(bookId, { finished: !currentFinished });
      await loadBooks();
    } catch (error) {
      console.error("Failed to update book:", error);
      // Revert on error
      await loadBooks();
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterGenre("ALL");
    setFilterFinished("ALL");
    setSortBy("title");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft sm:p-6">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">My Library</h2>
          <p className="mt-2 text-sm text-stone-600">
            Browse and search your personal book collection. A cozy place to
            explore what you're reading.
          </p>
        </div>

        <div className="mt-6 space-y-4 rounded-lg border border-stone-200 bg-stone-50/50 p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Input
                id="search"
                label="Search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title or author"
              />
              <Search className="absolute right-3 top-9 h-4 w-4 text-stone-400" />
            </div>

            <Select
              id="filter-genre"
              label="Genre"
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              options={[
                { value: "ALL", label: "All Genres" },
                ...availableGenres.map((g) => ({ value: g, label: g })),
              ]}
            />

            <Select
              id="filter-finished"
              label="Status"
              value={filterFinished}
              onChange={(e) =>
                setFilterFinished(
                  e.target.value as "ALL" | "FINISHED" | "UNFINISHED",
                )
              }
              options={[
                { value: "ALL", label: "All Books" },
                { value: "FINISHED", label: "Finished" },
                { value: "UNFINISHED", label: "Unfinished" },
              ]}
            />

            <Select
              id="sort-by"
              label="Sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              options={[
                { value: "title", label: "Title (A–Z)" },
                { value: "author", label: "Author (A–Z)" },
                { value: "updated", label: "Recently Updated" },
              ]}
            />
          </div>

          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div className="text-sm text-stone-600">
              {filteredBooks.length}{" "}
              {filteredBooks.length === 1 ? "book" : "books"}
            </div>
            {(searchQuery ||
              filterGenre !== "ALL" ||
              filterFinished !== "ALL" ||
              sortBy !== "title") && (
              <Button
                variant="secondary"
                onClick={handleClearFilters}
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-stone-200 bg-white/80 px-4 py-8 text-center text-sm text-stone-500 shadow-sm">
            Loading library...
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-4 py-12 text-center text-sm text-stone-600">
            <p className="font-medium">No books yet</p>
            <p className="mt-1 text-xs text-stone-500">
              Start building your library by adding books from the Admin page.
            </p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-4 py-12 text-center text-sm text-stone-600">
            <p className="font-medium">No matches found</p>
            <p className="mt-2">
              <Button
                variant="secondary"
                onClick={handleClearFilters}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                variant="view"
                onToggleFinished={handleToggleFinished}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

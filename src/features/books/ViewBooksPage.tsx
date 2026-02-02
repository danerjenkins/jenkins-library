import { useEffect, useState } from "react";
import { getAllBooks } from "../../data/bookRepo";
import type { Book } from "./bookTypes";

export function ViewBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("ALL");
  const [filterFinished, setFilterFinished] = useState<
    "ALL" | "FINISHED" | "UNFINISHED"
  >("ALL");

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
  const filteredBooks = books.filter((book) => {
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft sm:p-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">My Library</h2>
          <p className="mt-2 text-sm text-slate-600">
            Browse and search your personal book collection. A cozy place to
            explore what you're reading.
          </p>
        </div>

        <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1 sm:col-span-1">
              <label
                htmlFor="search"
                className="text-xs font-medium text-slate-600 uppercase tracking-wide"
              >
                Search
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title or author"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-genre"
                className="text-xs font-medium text-slate-600 uppercase tracking-wide"
              >
                Genre
              </label>
              <select
                id="filter-genre"
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">All Genres</option>
                {availableGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-finished"
                className="text-xs font-medium text-slate-600 uppercase tracking-wide"
              >
                Status
              </label>
              <select
                id="filter-finished"
                value={filterFinished}
                onChange={(e) =>
                  setFilterFinished(
                    e.target.value as "ALL" | "FINISHED" | "UNFINISHED",
                  )
                }
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">All Books</option>
                <option value="FINISHED">Finished</option>
                <option value="UNFINISHED">Unfinished</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            {filteredBooks.length}{" "}
            {filteredBooks.length === 1 ? "book" : "books"}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
            Loading books...
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
            No books yet. Start building your library!
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
            No matches. Try clearing filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {book.title}
                      </h3>
                      {book.finished && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 shrink-0">
                          Finished
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{book.author}</p>
                    {book.genre && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {book.genre}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

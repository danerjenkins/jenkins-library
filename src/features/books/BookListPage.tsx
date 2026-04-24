import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { addBook, deleteBook, getAllBooks } from "../../data/bookRepo";
import { LoadingState } from "../../ui/components/LoadingState";
import type { Book } from "./bookTypes";

type FinishedFilter = "ALL" | "FINISHED" | "UNFINISHED";

function BookListState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-warm-gray bg-cream/80 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function BookListPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [finished, setFinished] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("ALL");
  const [filterFinished, setFilterFinished] =
    useState<FinishedFilter>("ALL");

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

  const resetForm = useCallback(() => {
    setTitle("");
    setAuthor("");
    setGenre("");
    setFinished(false);
  }, []);

  const handleAddBook = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!title.trim() || !author.trim()) return;

      try {
        await addBook({
          title: title.trim(),
          author: author.trim(),
          genre: genre.trim() || null,
          finished,
        });
        resetForm();
        setShowForm(false);
        await loadBooks();
      } catch (error) {
        console.error("Failed to add book:", error);
      }
    },
    [author, finished, genre, loadBooks, resetForm, title],
  );

  const handleDeleteBook = useCallback(
    async (id: string, bookTitle: string) => {
      if (!confirm(`Delete "${bookTitle}"?`)) return;

      try {
        await deleteBook(id);
        await loadBooks();
      } catch (error) {
        console.error("Failed to delete book:", error);
      }
    },
    [loadBooks],
  );

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

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return books.filter((book) => {
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

      if (filterFinished === "FINISHED" && !book.finished) {
        return false;
      }

      if (filterFinished === "UNFINISHED" && book.finished) {
        return false;
      }

      return true;
    });
  }, [books, filterFinished, filterGenre, searchQuery]);

  const canSubmit = Boolean(title.trim() && author.trim());

  return (
    <div className="space-y-6 overflow-x-hidden">
      <section className="rounded-lg border border-warm-gray bg-cream/95 p-4 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-pretty text-slate-800">
              Books
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Your personal library catalog. Add books, scan the shelf, and
              keep local reading status available offline.
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-sage-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Book
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3 rounded-lg border border-warm-gray bg-parchment/80 p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-1">
              <label
                htmlFor="search"
                className="text-xs font-medium uppercase tracking-wide text-slate-600"
              >
                Search
              </label>
              <input
                id="search"
                name="search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Title or author…"
                autoComplete="off"
                className="rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label
                htmlFor="filter-genre"
                className="text-xs font-medium uppercase tracking-wide text-slate-600"
              >
                Genre
              </label>
              <select
                id="filter-genre"
                value={filterGenre}
                onChange={(event) => setFilterGenre(event.target.value)}
                className="rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              >
                <option value="ALL">All Genres</option>
                {availableGenres.map((bookGenre) => (
                  <option key={bookGenre} value={bookGenre}>
                    {bookGenre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label
                htmlFor="filter-finished"
                className="text-xs font-medium uppercase tracking-wide text-slate-600"
              >
                Status
              </label>
              <select
                id="filter-finished"
                value={filterFinished}
                onChange={(event) =>
                  setFilterFinished(event.target.value as FinishedFilter)
                }
                className="rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              >
                <option value="ALL">All Books</option>
                <option value="FINISHED">Finished</option>
                <option value="UNFINISHED">Unfinished</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-slate-600" aria-live="polite">
            {filteredBooks.length}{" "}
            {filteredBooks.length === 1 ? "book" : "books"}
          </div>
        </div>

        {showForm && (
          <form
            className="mt-5 grid gap-4 rounded-lg border border-warm-gray bg-parchment/80 p-4 shadow-sm"
            onSubmit={handleAddBook}
          >
            <div className="grid gap-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-slate-700"
              >
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter book title…"
                autoComplete="off"
                className="rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="author"
                className="text-sm font-medium text-slate-700"
              >
                Author
              </label>
              <input
                id="author"
                name="author"
                type="text"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Enter author name…"
                autoComplete="off"
                className="rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="genre"
                className="text-sm font-medium text-slate-700"
              >
                Genre (Optional)
              </label>
              <input
                id="genre"
                name="genre"
                type="text"
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                placeholder="Fiction, Non-fiction, Mystery…"
                autoComplete="off"
                className="rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              />
            </div>
            <label
              htmlFor="finished"
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md text-sm font-medium text-slate-700"
            >
              <input
                id="finished"
                name="finished"
                type="checkbox"
                checked={finished}
                onChange={(event) => setFinished(event.target.checked)}
                className="h-4 w-4 rounded border-warm-gray text-slate-900 focus:ring-2 focus:ring-sage/20"
              />
              I've finished reading this book
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canSubmit}
              >
                Add Book
              </button>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-warm-gray px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/25"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-3">
        {loading ? (
          <LoadingState
            title="Loading Books"
            description="Reading the local catalog before opening the list view."
            variant="panel"
          />
        ) : books.length === 0 ? (
          <BookListState>
            <p className="font-medium text-slate-700">No Books Yet</p>
            <p className="mt-1 text-xs">Use Add Book to start your catalog.</p>
          </BookListState>
        ) : filteredBooks.length === 0 ? (
          <BookListState>
            <p className="font-medium text-slate-700">No Matches Found</p>
            <p className="mt-1 text-xs">Try a different search or filter.</p>
          </BookListState>
        ) : (
          <div className="grid gap-3">
            {filteredBooks.map((book) => (
              <article
                key={book.id}
                className="grid min-w-0 gap-3 rounded-lg border border-warm-gray bg-cream px-4 py-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="min-w-0 break-words text-lg font-semibold leading-6 text-slate-800">
                      {book.title}
                    </h3>
                    {book.finished && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Finished
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-words text-sm text-slate-600">
                    {book.author}
                  </p>
                  {book.genre && (
                    <p className="mt-2 inline-flex max-w-full rounded-md bg-warm-gray-light px-2 py-1 text-xs text-slate-600">
                      <span className="break-words">Genre: {book.genre}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-100 sm:self-center"
                  onClick={() => handleDeleteBook(book.id, book.title)}
                  aria-label={`Delete ${book.title}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

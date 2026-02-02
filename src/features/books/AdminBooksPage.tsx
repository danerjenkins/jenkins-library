import { useEffect, useState } from "react";
import { getAllBooks, addBook, updateBook, deleteBook } from "../../data/bookRepo";
import type { Book } from "./bookTypes";

export function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [finished, setFinished] = useState(false);

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

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    try {
      if (editingId) {
        // Update existing book
        await updateBook(editingId, {
          title: title.trim(),
          author: author.trim(),
          genre: genre.trim() || null,
          finished,
        });
      } else {
        // Add new book
        await addBook({
          title: title.trim(),
          author: author.trim(),
          genre: genre.trim() || null,
          finished,
        });
      }
      setTitle("");
      setAuthor("");
      setGenre("");
      setFinished(false);
      setEditingId(null);
      setShowForm(false);
      await loadBooks();
    } catch (error) {
      console.error("Failed to save book:", error);
    }
  }

  function handleEditBook(book: Book) {
    setTitle(book.title);
    setAuthor(book.author);
    setGenre(book.genre || "");
    setFinished(book.finished || false);
    setEditingId(book.id);
    setShowForm(true);
  }

  function handleCancelEdit() {
    setTitle("");
    setAuthor("");
    setGenre("");
    setFinished(false);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleDeleteBook(id: string, bookTitle: string) {
    if (!confirm(`Delete "${bookTitle}"?`)) return;

    try {
      await deleteBook(id);
      await loadBooks();
    } catch (error) {
      console.error("Failed to delete book:", error);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Manage Books</h2>
            <p className="mt-2 text-sm text-slate-600">
              Add, edit, and delete books from your library. Admin tools for managing your collection.
            </p>
          </div>
          {!showForm && (
            <button
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              onClick={() => setShowForm(true)}
            >
              Add Book
            </button>
          )}
        </div>

        {showForm && (
          <form
            className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
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
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
                autoFocus
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="genre"
                className="text-sm font-medium text-slate-700"
              >
                Genre (optional)
              </label>
              <input
                id="genre"
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Fiction, Non-fiction, Mystery"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="finished"
                type="checkbox"
                checked={finished}
                onChange={(e) => setFinished(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-200"
              />
              <label
                htmlFor="finished"
                className="text-sm font-medium text-slate-700"
              >
                I've finished reading this book
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!title.trim() || !author.trim()}
              >
                {editingId ? "Update Book" : "Add Book"}
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
            Loading books...
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
            No books yet. Click "Add Book" to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <div
                key={book.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {book.title}
                    </h3>
                    {book.finished && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Finished
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{book.author}</p>
                  {book.genre && (
                    <p className="mt-1 text-xs text-slate-500">
                      Genre: {book.genre}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <button
                    className="rounded-md border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    onClick={() => handleEditBook(book)}
                    aria-label={`Edit ${book.title}`}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-md border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    onClick={() => handleDeleteBook(book.id, book.title)}
                    aria-label={`Delete ${book.title}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getAllBooks, addBook, deleteBook } from "../../data/bookRepo";
import type { Book } from "./bookTypes";

export function BookListPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

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
      await addBook({ title: title.trim(), author: author.trim() });
      setTitle("");
      setAuthor("");
      setShowForm(false);
      await loadBooks();
    } catch (error) {
      console.error("Failed to add book:", error);
    }
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
            <h2 className="text-2xl font-semibold text-slate-800">Books</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your personal library catalog. Add and manage your book collection
              here. This is a local-first progressive web app that works
              offline.
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

        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Search and filters will live here soon.
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!title.trim() || !author.trim()}
              >
                Add Book
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={() => {
                  setShowForm(false);
                  setTitle("");
                  setAuthor("");
                }}
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
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {book.title}
                  </h3>
                  <p className="text-sm text-slate-600">{book.author}</p>
                </div>
                <button
                  className="self-start rounded-md border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  onClick={() => handleDeleteBook(book.id, book.title)}
                  aria-label={`Delete ${book.title}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

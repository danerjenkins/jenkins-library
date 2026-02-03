import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  getAllBooks,
  addBook,
  updateBook,
  deleteBook,
} from "../../data/bookRepo";
import type { Book } from "./bookTypes";
import { Button } from "../../ui/components/Button";
import { BookCard } from "./components/BookCard";
import { BookForm } from "./components/BookForm";
import { syncService, type SyncStatus } from "../../sync/syncService";
import { driveClient } from "../../sync/driveClient";

export function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [isbn, setIsbn] = useState("");
  const [finished, setFinished] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [readByDane, setReadByDane] = useState(false);
  const [readByEmma, setReadByEmma] = useState(false);

  // Sync info state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [lastPushTime, setLastPushTime] = useState<number | null>(null);
  const [lastPullTime, setLastPullTime] = useState<number | null>(null);

  // Load books on mount
  useEffect(() => {
    loadBooks();
    // Load sync info
    const lastPush = syncService.getLastPushTime();
    const lastPull = syncService.getLastPullTime();
    const lastMsg = syncService.getLastMessage();
    const lastErr = syncService.getLastError();

    setLastPushTime(lastPush);
    setLastPullTime(lastPull);

    if (lastErr) {
      setSyncStatus("error");
      setSyncMessage(lastErr);
    } else if (lastMsg) {
      setSyncStatus("success");
      setSyncMessage(lastMsg);
    }
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
          isbn: isbn.trim() || null,
          finished,
          coverUrl: coverUrl.trim() || null,
          readByDane,
          readByEmma,
        });
      } else {
        // Add new book
        await addBook({
          title: title.trim(),
          author: author.trim(),
          genre: genre.trim() || null,
          isbn: isbn.trim() || null,
          finished,
          coverUrl: coverUrl.trim() || null,
          readByDane,
          readByEmma,
        });
      }
      setTitle("");
      setAuthor("");
      setGenre("");
      setIsbn("");
      setFinished(false);
      setCoverUrl("");
      setReadByDane(false);
      setReadByEmma(false);
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
    setIsbn(book.isbn || "");
    setFinished(book.finished || false);
    setCoverUrl(book.coverUrl || "");
    setReadByDane(book.readByDane);
    setReadByEmma(book.readByEmma);
    setEditingId(book.id);
    setShowForm(true);
  }

  function handleCancelEdit() {
    setTitle("");
    setAuthor("");
    setGenre("");
    setIsbn("");
    setFinished(false);
    setCoverUrl("");
    setReadByDane(false);
    setReadByEmma(false);
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

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const statusLabel: Record<SyncStatus, string> = {
    idle: "Idle",
    syncing: "Syncing",
    success: "Success",
    error: "Error",
  };

  const statusClass: Record<SyncStatus, string> = {
    idle: "text-stone-500",
    syncing: "text-amber-700",
    success: "text-emerald-700",
    error: "text-rose-600",
  };

  const userEmail = driveClient.getActiveUserEmail();
  const isSignedIn = driveClient.isAuthenticated();
  const accountLabel = isSignedIn ? userEmail || "Signed in" : "Not signed in";
  const statusMessage = syncMessage || "Ready";

  return (
    <div className="space-y-6">
      {/* Sync info panel */}
      <section className="sync-panel border border-stone-200 rounded-2xl bg-linear-to-r from-white/50 to-amber-50/30 shadow-soft">
        <div className="mx-auto grid gap-3 px-4 py-4 text-sm text-stone-700 sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-500">File:</span>
            <span className="font-mono text-xs">
              {syncService.getSyncFilename()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Account:</span>
            <span>{accountLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Last Push:</span>
            <span>{formatTime(lastPushTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Last Pull:</span>
            <span>{formatTime(lastPullTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Status:</span>
            <span className={statusClass[syncStatus]}>
              {statusLabel[syncStatus]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Message:</span>
            <span className={statusClass[syncStatus]}>{statusMessage}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900">
              Manage Books
            </h2>
            <p className="font-sans mt-2 text-sm leading-relaxed text-stone-600">
              Add, edit, and delete books from your library. Admin tools for
              managing your collection.
            </p>
          </div>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Book
              </span>
            </Button>
          )}
        </div>

        {showForm && (
          <div className="mt-5">
            <BookForm
              isEditing={!!editingId}
              title={title}
              author={author}
              genre={genre}
              isbn={isbn}
              finished={finished}
              coverUrl={coverUrl}
              readByDane={readByDane}
              readByEmma={readByEmma}
              onTitleChange={setTitle}
              onAuthorChange={setAuthor}
              onGenreChange={setGenre}
              onIsbnChange={setIsbn}
              onFinishedChange={setFinished}
              onCoverUrlChange={setCoverUrl}
              onReadByDaneChange={setReadByDane}
              onReadByEmmaChange={setReadByEmma}
              onSubmit={handleAddBook}
              onCancel={handleCancelEdit}
            >
              {editingId && <span>Editing book...</span>}
            </BookForm>
          </div>
        )}
      </section>
      <section className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-stone-200 bg-white/80 px-4 py-8 text-center text-sm text-stone-500 shadow-sm">
            Loading books...
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-4 py-12 text-center text-sm text-stone-600">
            <p className="font-medium">No books yet</p>
            <p className="mt-1 text-xs text-stone-500">
              Click "Add Book" to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                variant="admin"
                actions={
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleEditBook(book)}
                      className="text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </span>
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className="text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </span>
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

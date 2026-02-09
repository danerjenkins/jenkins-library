import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  getAllBooks,
  addBook,
  updateBook,
  deleteBook,
  setBookSeries,
  clearBookSeries,
} from "../../data/bookRepo";
import { createSeries, findSeriesByName } from "../../repos/seriesRepo";
import {
  saveCoverPhoto,
  deleteCoverPhoto,
  getCoverPhotoUrl,
} from "../../data/db";
import type { Book, BookFormat } from "./bookTypes";
import { Button } from "../../ui/components/Button";
import { BookCard } from "./components/BookCard";
import { BookForm } from "./components/BookForm";

export function AdminBooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [isbn, setIsbn] = useState("");
  const [finished, setFinished] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [format, setFormat] = useState("");
  const [pages, setPages] = useState("");
  const [readByDane, setReadByDane] = useState(false);
  const [readByEmma, setReadByEmma] = useState(false);
  const [seriesName, setSeriesName] = useState("");
  const [seriesLabel, setSeriesLabel] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [showCoverSaved, setShowCoverSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cardSize, setCardSize] = useState<"small" | "medium" | "large">(
    "medium",
  );

  const resolveErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Something went wrong. Please try again.";
  };

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, []);

  // Handle edit query parameter
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && books.length > 0) {
      const bookToEdit = books.find((b) => b.id === editId);
      if (bookToEdit) {
        handleEditBook(bookToEdit);
        // Clear the query parameter
        setSearchParams({});
      }
    }
  }, [searchParams, books]);

  async function loadBooks() {
    try {
      setLoading(true);
      setErrorMessage(null);
      const allBooks = await getAllBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error("Failed to load books:", error);
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function handleEditBook(book: Book) {
    setTitle(book.title);
    setAuthor(book.author);
    setGenre(book.genre || "");
    setDescription(book.description || "");
    setIsbn(book.isbn || "");
    setFinished(book.finished || false);
    setCoverUrl(book.coverUrl || "");
    setFormat(book.format || "");
    setPages(book.pages?.toString() || "");
    setReadByDane(book.readByDane);
    setReadByEmma(book.readByEmma);
    setSeriesName(book.seriesName || "");
    setSeriesLabel(
      book.seriesLabel ??
        (book.seriesSort !== null && book.seriesSort !== undefined
          ? String(book.seriesSort)
          : ""),
    );
    setEditingId(book.id);
    handleLoadCoverPhoto(book.id);
    setShowForm(true);
  }

  const handleClearSeries = () => {
    setSeriesName("");
    setSeriesLabel("");
  };

  const resolveSeriesId = async (name: string) => {
    const existing = await findSeriesByName(name);
    if (existing) return existing.id;
    const created = await createSeries(name);
    return created.id;
  };

  const syncBookSeries = async (bookId: string) => {
    const trimmedName = seriesName.trim();
    const trimmedLabel = seriesLabel.trim();

    if (!trimmedName) {
      await clearBookSeries(bookId);
      return;
    }

    const seriesId = await resolveSeriesId(trimmedName);
    const parsedSort = trimmedLabel ? Number.parseFloat(trimmedLabel) : NaN;
    const seriesSort = Number.isFinite(parsedSort) ? parsedSort : null;

    await setBookSeries(bookId, {
      seriesId,
      seriesLabel: trimmedLabel || null,
      seriesSort,
    });
  };

  const handleLoadCoverPhoto = async (bookId: string) => {
    const url = await getCoverPhotoUrl(bookId);
    setCoverPhotoUrl(url);
  };

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    try {
      setErrorMessage(null);
      if (editingId) {
        // Update existing book
        const updated = await updateBook(editingId, {
          title: title.trim(),
          author: author.trim(),
          genre: genre.trim() || null,
          description: description.trim() || null,
          isbn: isbn.trim() || null,
          finished,
          coverUrl: coverUrl.trim() || null,
          format: format ? (format as BookFormat) : undefined,
          pages: pages ? parseInt(pages, 10) : undefined,
          readByDane,
          readByEmma,
        });
        await syncBookSeries(updated.id);
      } else {
        // Add new book
        const created = await addBook({
          title: title.trim(),
          author: author.trim(),
          genre: genre.trim() || null,
          description: description.trim() || null,
          isbn: isbn.trim() || null,
          finished,
          coverUrl: coverUrl.trim() || null,
          format: format ? (format as BookFormat) : undefined,
          pages: pages ? parseInt(pages, 10) : undefined,
          readByDane,
          readByEmma,
        });
        await syncBookSeries(created.id);
      }
      setTitle("");
      setAuthor("");
      setGenre("");
      setDescription("");
      setIsbn("");
      setFinished(false);
      setCoverUrl("");
      setFormat("");
      setPages("");
      setReadByDane(false);
      setReadByEmma(false);
      setSeriesName("");
      setSeriesLabel("");
      setEditingId(null);
      setShowForm(false);
      await loadBooks();
    } catch (error) {
      console.error("Failed to save book:", error);
      setErrorMessage(resolveErrorMessage(error));
    }
  }

  function handleCancelEdit() {
    setTitle("");
    setAuthor("");
    setGenre("");
    setDescription("");
    setIsbn("");
    setFinished(false);
    setCoverUrl("");
    setFormat("");
    setPages("");
    setReadByDane(false);
    setReadByEmma(false);
    setSeriesName("");
    setSeriesLabel("");
    setCoverPhotoUrl(null);
    setEditingId(null);
    setShowForm(false);
  }

  const handleCoverPhotoCapture = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !editingId) return;

    try {
      await saveCoverPhoto(editingId, file);
      await updateBook(editingId, { coverUrl: null });
      setCoverUrl("");
      const url = await getCoverPhotoUrl(editingId);
      setCoverPhotoUrl(url);
      setShowCoverSaved(true);
      setTimeout(() => setShowCoverSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save cover photo:", error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveCoverPhoto = async () => {
    if (!editingId) return;
    try {
      await deleteCoverPhoto(editingId);
      if (coverPhotoUrl) {
        URL.revokeObjectURL(coverPhotoUrl);
      }
      setCoverPhotoUrl(null);
    } catch (error) {
      console.error("Failed to remove cover photo:", error);
    }
  };

  const handleCoverUrlChange = async (value: string) => {
    setCoverUrl(value);

    if (value.trim() && editingId) {
      try {
        await deleteCoverPhoto(editingId);
        if (coverPhotoUrl) {
          URL.revokeObjectURL(coverPhotoUrl);
        }
        setCoverPhotoUrl(null);
      } catch (error) {
        console.error("Failed to clear local cover photo:", error);
      }
    }
  };

  async function handleDeleteBook(id: string, bookTitle: string) {
    if (!confirm(`Delete "${bookTitle}"? This cannot be undone.`)) return;

    try {
      setErrorMessage(null);
      await deleteBook(id);
      await loadBooks();
    } catch (error) {
      console.error("Failed to delete book:", error);
      setErrorMessage(resolveErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4">
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
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}
          {!showForm && books.length > 0 && (
            <div className="flex gap-1 rounded-lg border border-warm-gray p-1 self-start">
              <button
                onClick={() => setCardSize("small")}
                className={`px-3 py-1 text-xs font-medium rounded transition ${
                  cardSize === "small"
                    ? "bg-sage text-white"
                    : "text-charcoal/70 hover:bg-warm-gray-light"
                }`}
              >
                Small
              </button>
              <button
                onClick={() => setCardSize("medium")}
                className={`px-3 py-1 text-xs font-medium rounded transition ${
                  cardSize === "medium"
                    ? "bg-sage text-white"
                    : "text-charcoal/70 hover:bg-warm-gray-light"
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setCardSize("large")}
                className={`px-3 py-1 text-xs font-medium rounded transition ${
                  cardSize === "large"
                    ? "bg-sage text-white"
                    : "text-charcoal/70 hover:bg-warm-gray-light"
                }`}
              >
                Large
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="mt-5 space-y-4">
            <BookForm
              isEditing={!!editingId}
              title={title}
              author={author}
              genre={genre}
              description={description}
              isbn={isbn}
              finished={finished}
              coverUrl={coverUrl}
              format={format}
              pages={pages}
              readByDane={readByDane}
              readByEmma={readByEmma}
              seriesName={seriesName}
              seriesLabel={seriesLabel}
              coverPhotoUrl={coverPhotoUrl}
              showCoverSaved={showCoverSaved}
              showCoverPhotoControls={!!editingId}
              coverPhotoInputRef={fileInputRef}
              onCoverPhotoFileChange={handleCoverPhotoCapture}
              onCoverPhotoPick={() => fileInputRef.current?.click()}
              onRemoveCoverPhoto={handleRemoveCoverPhoto}
              onTitleChange={setTitle}
              onAuthorChange={setAuthor}
              onGenreChange={setGenre}
              onDescriptionChange={setDescription}
              onIsbnChange={setIsbn}
              onFinishedChange={setFinished}
              onCoverUrlChange={handleCoverUrlChange}
              onFormatChange={setFormat}
              onPagesChange={setPages}
              onReadByDaneChange={setReadByDane}
              onReadByEmmaChange={setReadByEmma}
              onSeriesNameChange={setSeriesName}
              onSeriesLabelChange={setSeriesLabel}
              onClearSeries={handleClearSeries}
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
          <div
            className={`grid gap-4 ${
              cardSize === "small"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : cardSize === "medium"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                variant="admin"
                cardSize={cardSize}
                actions={
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => handleEditBook(book)}
                      className="text-xs flex-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </span>
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className="text-xs flex-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </span>
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

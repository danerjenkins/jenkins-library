import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
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
import type { Book, BookFormat, ReadStatus } from "./bookTypes";
import { getReadStatus, BOOK_FORMAT_LABELS } from "./bookTypes";
import { Button } from "../../ui/components/Button";
import { Input } from "../../ui/components/Input";
import { Select } from "../../ui/components/Select";
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

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("ALL");
  const [filterReadStatus, setFilterReadStatus] = useState<
    "ALL" | "NEITHER" | "DANE" | "EMMA" | "BOTH"
  >("ALL");
  const [filterFormat, setFilterFormat] = useState("ALL");
  const [filterSeries, setFilterSeries] = useState("ALL");

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

  const availableGenres = Array.from(
    new Set(
      books
        .map((b) => b.genre)
        .filter((g): g is string => g !== null && g !== undefined),
    ),
  ).sort();

  const availableFormats = Array.from(
    new Set(
      books
        .map((b) => b.format)
        .filter((f): f is BookFormat => f !== null && f !== undefined),
    ),
  ).sort();

  const availableSeries = Array.from(
    new Set(
      books
        .map((b) => b.seriesName)
        .filter((s): s is string => s !== null && s !== undefined),
    ),
  ).sort();

  const filteredBooks = books.filter((book) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (filterGenre !== "ALL" && book.genre !== filterGenre) {
      return false;
    }

    if (filterReadStatus !== "ALL") {
      const readStatus = getReadStatus(book);
      const filterMap: Record<string, ReadStatus> = {
        NEITHER: "neither",
        DANE: "dane",
        EMMA: "emma",
        BOTH: "both",
      };
      if (readStatus !== filterMap[filterReadStatus]) {
        return false;
      }
    }

    if (filterFormat !== "ALL" && book.format !== filterFormat) {
      return false;
    }

    if (filterSeries !== "ALL") {
      if (filterSeries === "NONE") {
        if (book.seriesName) return false;
      } else if (book.seriesName !== filterSeries) {
        return false;
      }
    }

    return true;
  });

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

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterGenre("ALL");
    setFilterReadStatus("ALL");
    setFilterFormat("ALL");
    setFilterSeries("ALL");
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

    let removed: { book: Book; index: number } | null = null;

    try {
      setErrorMessage(null);
      setBooks((prevBooks) => {
        const index = prevBooks.findIndex((book) => book.id === id);
        if (index >= 0) {
          removed = { book: prevBooks[index], index };
        }
        return prevBooks.filter((book) => book.id !== id);
      });
      await deleteBook(id);
    } catch (error) {
      console.error("Failed to delete book:", error);
      setErrorMessage(resolveErrorMessage(error));
      if (removed) {
        setBooks((prevBooks) => {
          const next = [...prevBooks];
          next.splice(removed.index, 0, removed.book);
          return next;
        });
      }
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
            <div className="rounded-2xl border border-stone-200/60 bg-stone-50/40 p-4 shadow-sm space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="relative">
                  <Input
                    id="admin-search"
                    label="Search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Title or author"
                  />
                  <Search className="absolute right-3 top-9 h-4 w-4 text-stone-400" />
                </div>

                <Select
                  id="admin-filter-genre"
                  label="Genre"
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                  options={[
                    { value: "ALL", label: "All Genres" },
                    ...availableGenres.map((g) => ({ value: g, label: g })),
                  ]}
                />

                <Select
                  id="admin-filter-read"
                  label="Read Status"
                  value={filterReadStatus}
                  onChange={(e) =>
                    setFilterReadStatus(
                      e.target.value as
                        | "ALL"
                        | "NEITHER"
                        | "DANE"
                        | "EMMA"
                        | "BOTH",
                    )
                  }
                  options={[
                    { value: "ALL", label: "All" },
                    { value: "NEITHER", label: "To read" },
                    { value: "DANE", label: "Read by Dane" },
                    { value: "EMMA", label: "Read by Emma" },
                    { value: "BOTH", label: "Read by both" },
                  ]}
                />

                <Select
                  id="admin-filter-format"
                  label="Format"
                  value={filterFormat}
                  onChange={(e) => setFilterFormat(e.target.value)}
                  options={[
                    { value: "ALL", label: "All Formats" },
                    ...availableFormats.map((fmt) => ({
                      value: fmt,
                      label: BOOK_FORMAT_LABELS[fmt],
                    })),
                  ]}
                />

                <Select
                  id="admin-filter-series"
                  label="Series"
                  value={filterSeries}
                  onChange={(e) => setFilterSeries(e.target.value)}
                  options={[
                    { value: "ALL", label: "All Series" },
                    { value: "NONE", label: "No Series" },
                    ...availableSeries.map((series) => ({
                      value: series,
                      label: series,
                    })),
                  ]}
                />
              </div>

              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="text-sm text-stone-600">
                  {filteredBooks.length}{" "}
                  {filteredBooks.length === 1 ? "book" : "books"}
                </div>
                {(searchQuery ||
                  filterGenre !== "ALL" ||
                  filterReadStatus !== "ALL" ||
                  filterFormat !== "ALL" ||
                  filterSeries !== "ALL") && (
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
          <div
            className={`grid gap-4 ${
              cardSize === "small"
                ? "grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : cardSize === "medium"
                  ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredBooks.map((book) => (
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

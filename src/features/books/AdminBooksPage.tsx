import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import {
  getAllBooks,
  getWishlistBooks,
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

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong. Please try again.";
}

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
  const [ownershipStatus, setOwnershipStatus] = useState<"owned" | "wishlist">(
    "owned",
  );
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
  const [filterOwnership, setFilterOwnership] = useState<"owned" | "wishlist">(
    "owned",
  );
  const [filterFormat, setFilterFormat] = useState("ALL");
  const [filterSeries, setFilterSeries] = useState("ALL");

  const loadBooks = useCallback(async (status: "owned" | "wishlist") => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const allBooks =
        status === "owned" ? await getAllBooks() : await getWishlistBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error("Failed to load books:", error);
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const availableGenres = useMemo(
    () =>
      Array.from(
        new Set(
          books
            .map((b) => b.genre)
            .filter((g): g is string => g !== null && g !== undefined),
        ),
      ).sort(),
    [books],
  );

  const availableFormats = useMemo(
    () =>
      Array.from(
        new Set(
          books
            .map((b) => b.format)
            .filter((f): f is BookFormat => f !== null && f !== undefined),
        ),
      ).sort(),
    [books],
  );

  const availableSeries = useMemo(
    () =>
      Array.from(
        new Set(
          books
            .map((b) => b.seriesName)
            .filter((s): s is string => s !== null && s !== undefined),
        ),
      ).sort(),
    [books],
  );

  const hasActiveFilters =
    !!searchQuery ||
    filterGenre !== "ALL" ||
    filterReadStatus !== "ALL" ||
    filterOwnership !== "owned" ||
    filterFormat !== "ALL" ||
    filterSeries !== "ALL";

  const filteredBooks = useMemo(() => {
    const trimmedSearch = searchQuery.trim().toLowerCase();

    return books
      .filter((book) => {
      if (searchQuery.trim()) {
        const matchesSearch =
          book.title.toLowerCase().includes(trimmedSearch) ||
          book.author.toLowerCase().includes(trimmedSearch);
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

      const ownershipStatus = book.ownershipStatus ?? "owned";
      if (ownershipStatus !== filterOwnership) {
        return false;
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
    })
      .sort((a, b) => {
      const genreA = (a.genre ?? "").toLowerCase();
      const genreB = (b.genre ?? "").toLowerCase();
      if (genreA !== genreB) return genreA.localeCompare(genreB);

      const authorA = (a.author ?? "").toLowerCase();
      const authorB = (b.author ?? "").toLowerCase();
      if (authorA !== authorB) return authorA.localeCompare(authorB);

      return a.title.localeCompare(b.title);
    });
  }, [
    books,
    filterFormat,
    filterGenre,
    filterOwnership,
    filterReadStatus,
    filterSeries,
    searchQuery,
  ]);

  const handleLoadCoverPhoto = useCallback(async (bookId: string) => {
    const url = await getCoverPhotoUrl(bookId);
    setCoverPhotoUrl(url);
  }, []);

  const handleEditBook = useCallback((book: Book) => {
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
    setOwnershipStatus(book.ownershipStatus ?? "owned");
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
  }, [handleLoadCoverPhoto]);

  // Load books on mount and when ownership tab changes.
  useEffect(() => {
    void loadBooks(filterOwnership);
  }, [filterOwnership, loadBooks]);

  // Handle edit query parameter once books are available.
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && books.length > 0) {
      const bookToEdit = books.find((b) => b.id === editId);
      if (bookToEdit) {
        handleEditBook(bookToEdit);
        setSearchParams({});
      }
    }
  }, [books, handleEditBook, searchParams, setSearchParams]);

  const handleClearSeries = () => {
    setSeriesName("");
    setSeriesLabel("");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterGenre("ALL");
    setFilterReadStatus("ALL");
    setFilterOwnership("owned");
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
          ownershipStatus,
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
          ownershipStatus,
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
      setOwnershipStatus("owned");
      setSeriesName("");
      setSeriesLabel("");
      setEditingId(null);
      setShowForm(false);
      await loadBooks(filterOwnership);
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
    setOwnershipStatus("owned");
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

    const removed = (() => {
      const index = books.findIndex((book) => book.id === id);
      if (index < 0) return null;
      return { book: books[index], index };
    })();

    try {
      setErrorMessage(null);
      setBooks((prevBooks) => {
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
      <section className="rounded-2xl border border-warm-gray bg-cream/95 p-4 shadow-soft sm:p-6">
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
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              role="alert"
            >
              {errorMessage}
            </div>
          )}
          {!showForm && books.length > 0 && (
            <div className="rounded-2xl border border-warm-gray bg-parchment/75 p-4 shadow-sm space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <div className="relative">
                  <Input
                    id="admin-search"
                    name="adminSearch"
                    label="Search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Title or author…"
                    autoComplete="off"
                  />
                  <Search
                    className="absolute right-3 top-9 h-4 w-4 text-stone-400"
                    aria-hidden="true"
                  />
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
                  id="admin-filter-ownership"
                  label="Ownership"
                  value={filterOwnership}
                  onChange={(e) =>
                    setFilterOwnership(e.target.value as "owned" | "wishlist")
                  }
                  options={[
                    { value: "owned", label: "Owned" },
                    { value: "wishlist", label: "Wishlist" },
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
                {hasActiveFilters && (
                  <Button
                    type="button"
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
                type="button"
                onClick={() => setCardSize("small")}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${
                  cardSize === "small"
                    ? "bg-sage text-white"
                    : "text-charcoal/70 hover:bg-warm-gray-light"
                }`}
              >
                Small
              </button>
              <button
                type="button"
                onClick={() => setCardSize("medium")}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${
                  cardSize === "medium"
                    ? "bg-sage text-white"
                    : "text-charcoal/70 hover:bg-warm-gray-light"
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setCardSize("large")}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${
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
              ownershipStatus={ownershipStatus}
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
              onOwnershipStatusChange={setOwnershipStatus}
              onSeriesNameChange={setSeriesName}
              onSeriesLabelChange={setSeriesLabel}
              onClearSeries={handleClearSeries}
              onSubmit={handleAddBook}
              onCancel={handleCancelEdit}
              onDelete={
                editingId
                  ? () => handleDeleteBook(editingId, title || "Untitled")
                  : undefined
              }
            >
              {editingId && <span>Editing Book</span>}
            </BookForm>
          </div>
        )}
      </section>
      <section className="space-y-3">
        {loading ? (
          <div
            className="rounded-xl border border-warm-gray bg-cream/90 px-4 py-8 text-center text-sm text-stone-500 shadow-sm"
            aria-live="polite"
          >
            Loading books…
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-warm-gray bg-parchment/75 px-4 py-12 text-center text-sm text-stone-600">
            <p className="font-medium">No books yet</p>
            <p className="mt-1 text-xs text-stone-500">
              Add your first book to start managing the library.
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowForm(true)}
              className="mt-4"
            >
              Add Book
            </Button>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-warm-gray bg-parchment/75 px-4 py-12 text-center text-sm text-stone-600">
            <p className="font-medium">No matches found</p>
            <p className="mt-1 text-xs text-stone-500">
              Adjust search or filters to see more books.
            </p>
            <p className="mt-2">
              <Button
                type="button"
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
                      className="text-xs px-2"
                      aria-label={`Edit ${book.title}`}
                      title="Edit"
                    >
                      <span className="flex items-center gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                        <span className="sr-only">Edit</span>
                      </span>
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className="text-xs px-2"
                      aria-label={`Delete ${book.title}`}
                      title="Delete"
                    >
                      <span className="flex items-center gap-1.5">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                        <span className="sr-only">Delete</span>
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

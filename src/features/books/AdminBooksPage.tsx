import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
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
import { BookForm, type BookFormSaveState } from "./components/BookForm";
import { ManageBookRow } from "./components/ManageBookRow";
import { ManageDeleteDialog } from "./components/ManageDeleteDialog";

const filterPanelClasses =
  "sticky top-2 z-20 space-y-3 rounded-2xl border border-warm-gray/85 bg-parchment/95 p-3 shadow-sm ring-1 ring-white/40 backdrop-blur-sm sm:top-3 sm:p-4 lg:static";
const filterPanelHeaderClasses =
  "flex flex-col gap-3 rounded-xl border border-warm-gray/70 bg-cream/90 p-3 sm:flex-row sm:items-start sm:justify-between";
const filterFieldGridClasses = "grid gap-3 sm:grid-cols-2 lg:grid-cols-5";
const filterMetaRowClasses =
  "flex flex-col items-start justify-between gap-2 rounded-lg border border-transparent px-1 py-0.5 sm:flex-row sm:items-center";
const segmentedControlClasses =
  "grid grid-cols-2 rounded-lg border border-warm-gray bg-cream p-1 shadow-inner shadow-white/50";
const segmentedButtonClasses =
  "min-h-10 rounded-md px-3 text-xs font-semibold uppercase tracking-[0.12em] transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";

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
  const [ownershipActionBookId, setOwnershipActionBookId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formSaveState, setFormSaveState] = useState<BookFormSaveState>("idle");
  const [formSaveMessage, setFormSaveMessage] = useState<string | null>(null);
  const [formSaveSignal, setFormSaveSignal] = useState(0);
  const [formIsDirty, setFormIsDirty] = useState(false);
  const [formSessionKey, setFormSessionKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formCloseTimeoutRef = useRef<number | null>(null);
  const formRegionRef = useRef<HTMLDivElement>(null);
  const pendingFormFocusRef = useRef(false);

  const clearPendingFormClose = useCallback(() => {
    if (formCloseTimeoutRef.current !== null) {
      window.clearTimeout(formCloseTimeoutRef.current);
      formCloseTimeoutRef.current = null;
    }
  }, []);

  const resetFormFeedback = useCallback(() => {
    clearPendingFormClose();
    setFormSaveState("idle");
    setFormSaveMessage(null);
    setFormIsDirty(false);
  }, [clearPendingFormClose]);

  const publishFormSaveState = useCallback(
    (nextState: BookFormSaveState, message: string | null) => {
      setFormSaveState(nextState);
      setFormSaveMessage(message);
      setFormSaveSignal((currentSignal) => currentSignal + 1);
    },
    [],
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
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const formInstanceKey = editingId
    ? `edit-${editingId}-${formSessionKey}`
    : `add-${formSessionKey}`;

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
    filterFormat !== "ALL" ||
    filterSeries !== "ALL";

  const filteredBooks = useMemo(() => {
    const trimmedSearch = deferredSearchQuery.trim().toLowerCase();

    return books
      .filter((book) => {
      if (trimmedSearch) {
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
    deferredSearchQuery,
  ]);

  const handleLoadCoverPhoto = useCallback(async (bookId: string) => {
    const url = await getCoverPhotoUrl(bookId);
    setCoverPhotoUrl(url);
  }, []);

  const resetFormFields = useCallback(() => {
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
    setShowCoverSaved(false);
  }, []);

  const handleStartAddBook = useCallback((defaultOwnership = filterOwnership) => {
    resetFormFeedback();
    setStatusMessage(null);
    resetFormFields();
    setFormSessionKey((currentKey) => currentKey + 1);
    setOwnershipStatus(defaultOwnership);
    setShowForm(true);
  }, [filterOwnership, resetFormFeedback, resetFormFields]);

  const handleEditBook = useCallback((book: Book) => {
    resetFormFeedback();
    setStatusMessage(null);
    setFormSessionKey((currentKey) => currentKey + 1);
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
    pendingFormFocusRef.current = true;
    setShowForm(true);
  }, [handleLoadCoverPhoto, resetFormFeedback]);

  useEffect(() => {
    return () => {
      clearPendingFormClose();
    };
  }, [clearPendingFormClose]);

  useEffect(() => {
    if (!showForm || !pendingFormFocusRef.current) return;

    const focusTarget = formRegionRef.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])',
    );

    formRegionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    focusTarget?.focus({ preventScroll: true });
    pendingFormFocusRef.current = false;
  }, [showForm, editingId, formInstanceKey]);

  // Load books on mount and when ownership tab changes.
  useEffect(() => {
    void loadBooks(filterOwnership);
  }, [filterOwnership, loadBooks]);

  // Handle edit query parameter once books are available.
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      const requestedOwnership =
        searchParams.get("ownership") === "wishlist" ? "wishlist" : "owned";
      setFilterOwnership(requestedOwnership);
      handleStartAddBook(requestedOwnership);
      setSearchParams({});
      return;
    }

    const requestedOwnership = searchParams.get("ownership");
    if (
      requestedOwnership === "owned" ||
      requestedOwnership === "wishlist"
    ) {
      setFilterOwnership(requestedOwnership);
    }

    const editId = searchParams.get("edit");
    if (editId && books.length > 0) {
      const bookToEdit = books.find((b) => b.id === editId);
      if (bookToEdit) {
        handleEditBook(bookToEdit);
        setSearchParams({});
      }
    }
  }, [books, handleEditBook, handleStartAddBook, searchParams, setSearchParams]);

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

  const handleOwnershipTabChange = (nextOwnership: "owned" | "wishlist") => {
    setFilterOwnership(nextOwnership);
    setSearchParams({ ownership: nextOwnership });
  };

  const handleQuickOwnershipToggle = useCallback(
    async (book: Book) => {
      const currentOwnership = book.ownershipStatus ?? "owned";
      const nextOwnership = currentOwnership === "owned" ? "wishlist" : "owned";

      setOwnershipActionBookId(book.id);
      setErrorMessage(null);
      setStatusMessage(null);
      setBooks((prevBooks) =>
        prevBooks.map((entry) =>
          entry.id === book.id ? { ...entry, ownershipStatus: nextOwnership } : entry,
        ),
      );

      try {
        await updateBook(book.id, { ownershipStatus: nextOwnership });
        setStatusMessage(
          nextOwnership === "wishlist"
            ? `Moved ${book.title} to Wishlist.`
            : `Added ${book.title} to Library.`,
        );
      } catch (error) {
        console.error("Failed to update ownership:", error);
        setErrorMessage(resolveErrorMessage(error));
        setBooks((prevBooks) =>
          prevBooks.map((entry) =>
            entry.id === book.id
              ? { ...entry, ownershipStatus: currentOwnership }
              : entry,
          ),
        );
      } finally {
        setOwnershipActionBookId(null);
      }
    },
    [],
  );

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

    const normalizedTitle = title.trim();
    const successMessage = editingId
      ? `Saved changes to ${normalizedTitle}.`
      : ownershipStatus === "wishlist"
        ? `Added ${normalizedTitle} to Wishlist.`
        : `Added ${normalizedTitle} to Library.`;

    try {
      setErrorMessage(null);
      setStatusMessage(null);
      publishFormSaveState("saving", editingId ? "Saving changes…" : "Saving new book…");
      if (editingId) {
        // Update existing book
        const updated = await updateBook(editingId, {
          title: normalizedTitle,
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
          title: normalizedTitle,
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

      publishFormSaveState("success", successMessage);
      setStatusMessage(successMessage);
      await loadBooks(filterOwnership);
      clearPendingFormClose();
      formCloseTimeoutRef.current = window.setTimeout(() => {
        resetFormFields();
        resetFormFeedback();
        setShowForm(false);
      }, 700);
    } catch (error) {
      console.error("Failed to save book:", error);
      const message = resolveErrorMessage(error);
      setErrorMessage(message);
      publishFormSaveState("error", message);
    }
  }

  function handleCancelEdit() {
    resetFormFeedback();
    resetFormFields();
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
      setStatusMessage("Saved a local cover photo.");
    } catch (error) {
      console.error("Failed to save cover photo:", error);
      setErrorMessage(resolveErrorMessage(error));
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
      setStatusMessage("Removed the local cover photo.");
    } catch (error) {
      console.error("Failed to remove cover photo:", error);
      setErrorMessage(resolveErrorMessage(error));
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
        setStatusMessage("Switched cover source to a URL.");
      } catch (error) {
        console.error("Failed to clear local cover photo:", error);
        setErrorMessage(resolveErrorMessage(error));
      }
    }
  };

  function handleRequestDeleteBook(book: Book) {
    setDeleteTarget(book);
  }

  async function handleConfirmDeleteBook() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    const removed = (() => {
      const index = books.findIndex((book) => book.id === id);
      if (index < 0) return null;
      return { book: books[index], index };
    })();

    try {
      setDeletePending(true);
      setErrorMessage(null);
      setDeleteTarget(null);
      setBooks((prevBooks) => {
        return prevBooks.filter((book) => book.id !== id);
      });
      await deleteBook(id);
      setStatusMessage(`Deleted ${deleteTarget.title}.`);
      if (editingId === id) {
        resetFormFeedback();
        resetFormFields();
        setShowForm(false);
      }
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
      setDeleteTarget(removed?.book ?? deleteTarget);
    } finally {
      setDeletePending(false);
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
                Add books and maintain catalog details. Browse covers and
                reading status from the Library and Wishlist pages.
              </p>
            </div>
            {!showForm && (
              <Button variant="primary" onClick={() => handleStartAddBook()}>
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
          {statusMessage && (
            <div
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              role="status"
              aria-live="polite"
            >
              {statusMessage}
            </div>
          )}
          {!showForm && (
            <div
              className={filterPanelClasses}
              role="region"
              aria-labelledby="manage-filters-heading"
              aria-describedby="manage-filters-summary"
            >
              <div className={filterPanelHeaderClasses}>
                <div className="space-y-1">
                  <div
                    id="manage-filters-heading"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
                  >
                    Manage Filters
                  </div>
                  <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
                    Switch between owned and wishlist inventory, then narrow the list
                    before editing.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    Shelf
                  </div>
                  <div
                    className={segmentedControlClasses}
                    role="tablist"
                    aria-label="Manage ownership"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={filterOwnership === "owned"}
                      onClick={() => handleOwnershipTabChange("owned")}
                      className={`${segmentedButtonClasses} ${
                        filterOwnership === "owned"
                          ? "bg-sage text-white shadow-sm"
                          : "text-charcoal/70 hover:bg-warm-gray-light hover:text-charcoal"
                      }`}
                    >
                      Owned
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={filterOwnership === "wishlist"}
                      onClick={() => handleOwnershipTabChange("wishlist")}
                      className={`${segmentedButtonClasses} ${
                        filterOwnership === "wishlist"
                          ? "bg-sage text-white shadow-sm"
                          : "text-charcoal/70 hover:bg-warm-gray-light hover:text-charcoal"
                      }`}
                    >
                      Wishlist
                    </button>
                  </div>
                </div>
              </div>

              <div className={filterFieldGridClasses}>
                <div className="relative">
                  <Input
                    id="admin-search"
                    name="adminSearch"
                    label="Search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Title or author…"
                    autoComplete="off"
                    className="!pl-11 pr-10"
                  />
                  <Search
                    className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-stone-400"
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

              <div className={filterMetaRowClasses}>
                <div
                  id="manage-filters-summary"
                  className="text-xs text-stone-600"
                  aria-live="polite"
                >
                  {filteredBooks.length}{" "}
                  {filteredBooks.length === 1 ? "book" : "books"}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <div className="text-xs text-stone-500">
                    Keep the queue compact so edit actions stay quick and predictable.
                  </div>
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClearFilters}
                      className="min-h-10 px-3 text-xs"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div
            ref={formRegionRef}
            className="mt-5 space-y-4 scroll-mt-24"
            aria-label={editingId ? "Edit book form" : "Add book form"}
          >
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
              saveState={formSaveState}
              saveMessage={formSaveMessage}
              saveSignal={formSaveSignal}
              formInstanceKey={formInstanceKey}
              onDirtyChange={setFormIsDirty}
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
                  ? () =>
                      handleRequestDeleteBook({
                        id: editingId,
                        title: title || "Untitled",
                        author,
                        genre: genre || null,
                        description: description || null,
                        isbn: isbn || null,
                        finished,
                        coverUrl: coverUrl || null,
                        readByDane,
                        readByEmma,
                        format: format ? (format as BookFormat) : undefined,
                        pages: pages ? parseInt(pages, 10) : undefined,
                        seriesName: seriesName || null,
                        seriesLabel: seriesLabel || null,
                        ownershipStatus,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                      })
                  : undefined
              }
            >
              {editingId ? (
                <span>
                  {formIsDirty ? "Editing Book - Unsaved Changes" : "Editing Book"}
                </span>
              ) : (
                <span>
                  {formIsDirty ? "Adding Book - Unsaved Changes" : "Add A Book"}
                </span>
              )}
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
              {filterOwnership === "wishlist"
                ? "Add a wishlist book to start tracking what you want."
                : "Add your first book to start managing the library."}
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleStartAddBook(filterOwnership)}
              className="mt-4"
            >
              {filterOwnership === "wishlist" ? "Add Wishlist Book" : "Add Book"}
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
          <div className="space-y-2" role="list" aria-label="Manage books">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                role="listitem"
              >
                <ManageBookRow
                  book={book}
                  ownershipBusy={ownershipActionBookId === book.id}
                  onEdit={handleEditBook}
                  onDelete={handleRequestDeleteBook}
                  onToggleOwnership={handleQuickOwnershipToggle}
                />
              </div>
            ))}
          </div>
        )}
      </section>
      <ManageDeleteDialog
        open={deleteTarget !== null}
        title={deleteTarget?.title ?? "Untitled"}
        busy={deletePending}
        onCancel={() => {
          if (!deletePending) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDeleteBook}
      />
    </div>
  );
}

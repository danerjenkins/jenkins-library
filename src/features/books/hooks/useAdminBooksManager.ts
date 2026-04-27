import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  addBook,
  clearBookSeries,
  deleteBook,
  getAllBooks,
  getWishlistBooks,
  setBookSeries,
  updateBook,
} from "../../../data/bookRepo";
import { deleteCoverPhoto, getCoverPhotoUrl, saveCoverPhoto } from "../../../data/db";
import { createSeries, findSeriesByName } from "../../../repos/seriesRepo";
import { getReadStatus } from "../bookTypes";
import type { Book, BookFormat, ReadStatus } from "../bookTypes";
import type { BookFormSaveState } from "../components/BookForm";
import { matchesBookSearchQuery } from "./discoveryBrowseShared";

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong. Please try again.";
}

const readStatusByFilter: Record<"NEITHER" | "DANE" | "EMMA" | "BOTH", ReadStatus> = {
  NEITHER: "neither",
  DANE: "dane",
  EMMA: "emma",
  BOTH: "both",
};

function buildEditableBook(state: {
  editingId: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  isbn: string;
  finished: boolean;
  coverUrl: string;
  readByDane: boolean;
  readByEmma: boolean;
  format: string;
  pages: string;
  seriesName: string;
  seriesLabel: string;
  ownershipStatus: "owned" | "wishlist";
}): Book {
  return {
    id: state.editingId,
    title: state.title || "Untitled",
    author: state.author,
    genre: state.genre || null,
    description: state.description || null,
    isbn: state.isbn || null,
    finished: state.finished,
    coverUrl: state.coverUrl || null,
    readByDane: state.readByDane,
    readByEmma: state.readByEmma,
    format: state.format ? (state.format as BookFormat) : undefined,
    pages: state.pages ? Number.parseInt(state.pages, 10) : undefined,
    seriesName: state.seriesName || null,
    seriesLabel: state.seriesLabel || null,
    ownershipStatus: state.ownershipStatus,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function useAdminBooksManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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
  const [ownershipStatus, setOwnershipStatus] = useState<"owned" | "wishlist">("owned");
  const [seriesName, setSeriesName] = useState("");
  const [seriesLabel, setSeriesLabel] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [showCoverSaved, setShowCoverSaved] = useState(false);
  const [ownershipActionBookId, setOwnershipActionBookId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [formSaveState, setFormSaveState] = useState<BookFormSaveState>("idle");
  const [formSaveMessage, setFormSaveMessage] = useState<string | null>(null);
  const [formSaveSignal, setFormSaveSignal] = useState(0);
  const [formIsDirty, setFormIsDirty] = useState(false);
  const [formSessionKey, setFormSessionKey] = useState(0);
  const [formFocusTick, setFormFocusTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("ALL");
  const [filterReadStatus, setFilterReadStatus] =
    useState<"ALL" | "NEITHER" | "DANE" | "EMMA" | "BOTH">("ALL");
  const [filterOwnership, setFilterOwnership] = useState<"owned" | "wishlist">("owned");
  const [filterFormat, setFilterFormat] = useState("ALL");
  const [filterSeries, setFilterSeries] = useState("ALL");
  const formCloseTimeoutRef = useRef<number | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const formInstanceKey = editingId ? `edit-${editingId}-${formSessionKey}` : `add-${formSessionKey}`;

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

  const publishFormSaveState = useCallback((nextState: BookFormSaveState, message: string | null) => {
    setFormSaveState(nextState);
    setFormSaveMessage(message);
    setFormSaveSignal((currentSignal) => currentSignal + 1);
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

  const loadBooks = useCallback(async (status: "owned" | "wishlist") => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const allBooks = status === "owned" ? await getAllBooks() : await getWishlistBooks();
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
        new Set(books.map((book) => book.genre).filter((genre): genre is string => Boolean(genre))),
      ).sort(),
    [books],
  );
  const availableFormats = useMemo(
    () =>
      Array.from(
        new Set(books.map((book) => book.format).filter((format): format is BookFormat => Boolean(format))),
      ).sort(),
    [books],
  );
  const availableSeries = useMemo(
    () =>
      Array.from(
        new Set(
          books.map((book) => book.seriesName).filter((series): series is string => Boolean(series)),
        ),
      ).sort(),
    [books],
  );

  const filteredBooks = useMemo(() => {
    const trimmedSearch = deferredSearchQuery.trim().toLowerCase();
    return books
      .filter((book) => {
        if (trimmedSearch && !matchesBookSearchQuery(book, trimmedSearch)) {
          return false;
        }
        if (filterGenre !== "ALL" && book.genre !== filterGenre) return false;
        if (filterReadStatus !== "ALL" && getReadStatus(book) !== readStatusByFilter[filterReadStatus]) {
          return false;
        }
        if ((book.ownershipStatus ?? "owned") !== filterOwnership) return false;
        if (filterFormat !== "ALL" && book.format !== filterFormat) return false;
        if (filterSeries === "NONE") return !book.seriesName;
        if (filterSeries !== "ALL" && book.seriesName !== filterSeries) return false;
        return true;
      })
      .sort((a, b) => {
        const genreA = (a.genre ?? "").toLowerCase();
        const genreB = (b.genre ?? "").toLowerCase();
        if (genreA !== genreB) return genreA.localeCompare(genreB);
        const authorA = a.author.toLowerCase();
        const authorB = b.author.toLowerCase();
        if (authorA !== authorB) return authorA.localeCompare(authorB);
        return a.title.localeCompare(b.title);
      });
  }, [
    books,
    deferredSearchQuery,
    filterFormat,
    filterGenre,
    filterOwnership,
    filterReadStatus,
    filterSeries,
  ]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    filterGenre !== "ALL" ||
    filterReadStatus !== "ALL" ||
    filterFormat !== "ALL" ||
    filterSeries !== "ALL";

  const handleLoadCoverPhoto = useCallback(async (bookId: string) => {
    setCoverPhotoUrl(await getCoverPhotoUrl(bookId));
  }, []);

  const handleStartAddBook = useCallback(
    (defaultOwnership = filterOwnership) => {
      resetFormFeedback();
      setStatusMessage(null);
      resetFormFields();
      setFormSessionKey((currentKey) => currentKey + 1);
      setOwnershipStatus(defaultOwnership);
      setShowForm(true);
      setFormFocusTick((currentTick) => currentTick + 1);
    },
    [filterOwnership, resetFormFeedback, resetFormFields],
  );

  const handleEditBook = useCallback(
    (book: Book) => {
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
          (book.seriesSort !== null && book.seriesSort !== undefined ? String(book.seriesSort) : ""),
      );
      setEditingId(book.id);
      void handleLoadCoverPhoto(book.id);
      setShowForm(true);
      setFormFocusTick((currentTick) => currentTick + 1);
    },
    [handleLoadCoverPhoto, resetFormFeedback],
  );

  useEffect(() => () => clearPendingFormClose(), [clearPendingFormClose]);

  useEffect(() => {
    void loadBooks(filterOwnership);
  }, [filterOwnership, loadBooks]);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      const requestedOwnership = searchParams.get("ownership") === "wishlist" ? "wishlist" : "owned";
      setFilterOwnership(requestedOwnership);
      handleStartAddBook(requestedOwnership);
      setSearchParams({});
      return;
    }

    const requestedOwnership = searchParams.get("ownership");
    if (requestedOwnership === "owned" || requestedOwnership === "wishlist") {
      setFilterOwnership(requestedOwnership);
    }

    const editId = searchParams.get("edit");
    if (editId && books.length > 0) {
      const bookToEdit = books.find((book) => book.id === editId);
      if (bookToEdit) {
        handleEditBook(bookToEdit);
        setSearchParams({});
      }
    }
  }, [books, handleEditBook, handleStartAddBook, searchParams, setSearchParams]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterGenre("ALL");
    setFilterReadStatus("ALL");
    setFilterFormat("ALL");
    setFilterSeries("ALL");
  }, []);

  const handleOwnershipTabChange = useCallback(
    (nextOwnership: "owned" | "wishlist") => {
      setFilterOwnership(nextOwnership);
      setSearchParams({ ownership: nextOwnership });
    },
    [setSearchParams],
  );

  const handleQuickOwnershipToggle = useCallback(async (book: Book) => {
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
          entry.id === book.id ? { ...entry, ownershipStatus: currentOwnership } : entry,
        ),
      );
    } finally {
      setOwnershipActionBookId(null);
    }
  }, []);

  const resolveSeriesId = useCallback(async (name: string) => {
    const existing = await findSeriesByName(name);
    if (existing) return existing.id;
    const created = await createSeries(name);
    return created.id;
  }, []);

  const syncBookSeries = useCallback(async (bookId: string) => {
    const trimmedName = seriesName.trim();
    const trimmedLabel = seriesLabel.trim();
    if (!trimmedName) {
      await clearBookSeries(bookId);
      return;
    }
    const seriesId = await resolveSeriesId(trimmedName);
    const parsedSort = trimmedLabel ? Number.parseFloat(trimmedLabel) : Number.NaN;
    await setBookSeries(bookId, {
      seriesId,
      seriesLabel: trimmedLabel || null,
      seriesSort: Number.isFinite(parsedSort) ? parsedSort : null,
    });
  }, [resolveSeriesId, seriesLabel, seriesName]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
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
      publishFormSaveState("saving", editingId ? "Saving changes..." : "Saving new book...");
      if (editingId) {
        const updated = await updateBook(editingId, {
          title: normalizedTitle,
          author: author.trim(),
          genre: genre.trim() || null,
          description: description.trim() || null,
          isbn: isbn.trim() || null,
          finished,
          coverUrl: coverUrl.trim() || null,
          format: format ? (format as BookFormat) : undefined,
          pages: pages ? Number.parseInt(pages, 10) : undefined,
          readByDane,
          readByEmma,
          ownershipStatus,
        });
        await syncBookSeries(updated.id);
      } else {
        const created = await addBook({
          title: normalizedTitle,
          author: author.trim(),
          genre: genre.trim() || null,
          description: description.trim() || null,
          isbn: isbn.trim() || null,
          finished,
          coverUrl: coverUrl.trim() || null,
          format: format ? (format as BookFormat) : undefined,
          pages: pages ? Number.parseInt(pages, 10) : undefined,
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
  }, [
    author,
    clearPendingFormClose,
    coverUrl,
    description,
    editingId,
    filterOwnership,
    finished,
    format,
    genre,
    isbn,
    loadBooks,
    ownershipStatus,
    pages,
    publishFormSaveState,
    readByDane,
    readByEmma,
    resetFormFeedback,
    resetFormFields,
    syncBookSeries,
    title,
  ]);

  const handleCancelEdit = useCallback(() => {
    resetFormFeedback();
    resetFormFields();
    setShowForm(false);
  }, [resetFormFeedback, resetFormFields]);

  const handleCoverPhotoCapture = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingId) return;
    try {
      await saveCoverPhoto(editingId, file);
      await updateBook(editingId, { coverUrl: null });
      setCoverUrl("");
      setCoverPhotoUrl(await getCoverPhotoUrl(editingId));
      setShowCoverSaved(true);
      window.setTimeout(() => setShowCoverSaved(false), 2000);
      setStatusMessage("Saved a local cover photo.");
    } catch (error) {
      console.error("Failed to save cover photo:", error);
      setErrorMessage(resolveErrorMessage(error));
    }
    event.currentTarget.value = "";
  }, [editingId]);

  const handleRemoveCoverPhoto = useCallback(async () => {
    if (!editingId) return;
    try {
      await deleteCoverPhoto(editingId);
      if (coverPhotoUrl) URL.revokeObjectURL(coverPhotoUrl);
      setCoverPhotoUrl(null);
      setStatusMessage("Removed the local cover photo.");
    } catch (error) {
      console.error("Failed to remove cover photo:", error);
      setErrorMessage(resolveErrorMessage(error));
    }
  }, [coverPhotoUrl, editingId]);

  const handleCoverUrlChange = useCallback(async (value: string) => {
    setCoverUrl(value);
    if (value.trim() && editingId) {
      try {
        await deleteCoverPhoto(editingId);
        if (coverPhotoUrl) URL.revokeObjectURL(coverPhotoUrl);
        setCoverPhotoUrl(null);
        setStatusMessage("Switched cover source to a URL.");
      } catch (error) {
        console.error("Failed to clear local cover photo:", error);
        setErrorMessage(resolveErrorMessage(error));
      }
    }
  }, [coverPhotoUrl, editingId]);

  const handleConfirmDeleteBook = useCallback(async () => {
    if (!deleteTarget) return;
    const { id, title: deleteTitle } = deleteTarget;
    const removed = (() => {
      const index = books.findIndex((book) => book.id === id);
      if (index < 0) return null;
      return { book: books[index], index };
    })();

    try {
      setDeletePending(true);
      setErrorMessage(null);
      setDeleteTarget(null);
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
      await deleteBook(id);
      setStatusMessage(`Deleted ${deleteTitle}.`);
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
  }, [books, deleteTarget, editingId, resetFormFeedback, resetFormFields]);

  return {
    page: { loading, errorMessage, statusMessage, showForm, formFocusTick },
    filters: {
      searchQuery,
      filterGenre,
      filterReadStatus,
      filterOwnership,
      filterFormat,
      filterSeries,
      availableGenres,
      availableFormats,
      availableSeries,
      filteredBooks,
      hasActiveFilters,
    },
    form: {
      editingId,
      title,
      author,
      genre,
      description,
      isbn,
      finished,
      coverUrl,
      format,
      pages,
      readByDane,
      readByEmma,
      ownershipStatus,
      seriesName,
      seriesLabel,
      coverPhotoUrl,
      showCoverSaved,
      formSaveState,
      formSaveMessage,
      formSaveSignal,
      formIsDirty,
      formInstanceKey,
    },
    modal: { deleteTarget, deletePending },
    list: { books, ownershipActionBookId },
    actions: {
      setSearchQuery,
      setFilterGenre,
      setFilterReadStatus,
      setFilterFormat,
      setFilterSeries,
      handleOwnershipTabChange,
      handleClearFilters,
      handleStartAddBook,
      handleEditBook,
      handleCancelEdit,
      handleQuickOwnershipToggle,
      handleSubmit,
      handleCoverPhotoCapture,
      handleRemoveCoverPhoto,
      handleCoverUrlChange,
      handleConfirmDeleteBook,
      setDeleteTarget,
      setFormIsDirty,
      setTitle,
      setAuthor,
      setGenre,
      setDescription,
      setIsbn,
      setFinished,
      setFormat,
      setPages,
      setReadByDane,
      setReadByEmma,
      setOwnershipStatus,
      setSeriesName,
      setSeriesLabel,
      clearSeries: () => {
        setSeriesName("");
        setSeriesLabel("");
      },
      requestDeleteFromForm: () =>
        editingId
          ? setDeleteTarget(
              buildEditableBook({
                editingId,
                title,
                author,
                genre,
                description,
                isbn,
                finished,
                coverUrl,
                readByDane,
                readByEmma,
                format,
                pages,
                seriesName,
                seriesLabel,
                ownershipStatus,
              }),
            )
          : undefined,
    },
  };
}

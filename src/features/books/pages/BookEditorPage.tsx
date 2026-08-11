import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  addBook,
  clearBookSeries,
  deleteBook,
  getBookById,
  setBookSeries,
  updateBook,
} from "../../../data/bookRepo";
import { deleteCoverPhoto, getCoverPhotoUrl, saveCoverPhoto } from "../../../data/db";
import { createSeries, findSeriesByName } from "../../../repos/seriesRepo";
import { LoadingState } from "../../../ui/components/LoadingState";
import type { Book, BookFormat } from "../lib/bookTypes";
import { BookForm, type BookFormSaveState } from "../forms/BookForm";
import { ManageDeleteDialog } from "../components/manage/ManageDeleteDialog";

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong. Please try again.";
}

function resolveReturnTo(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function BookEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localCoverObjectUrlRef = useRef<string | null>(null);
  const isEditing = Boolean(id);
  const fallbackReturnPath = isEditing && id ? `/book/${id}` : "/admin";
  const returnTo = resolveReturnTo(searchParams.get("returnTo"), fallbackReturnPath);

  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    searchParams.get("ownership") === "wishlist" ? "wishlist" : "owned",
  );
  const [seriesName, setSeriesName] = useState("");
  const [seriesLabel, setSeriesLabel] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [showCoverSaved, setShowCoverSaved] = useState(false);
  const [saveState, setSaveState] = useState<BookFormSaveState>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveSignal, setSaveSignal] = useState(0);
  const [formIsDirty, setFormIsDirty] = useState(false);
  const [formSessionKey, setFormSessionKey] = useState(0);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isEditing || !id) {
      setLoading(false);
      return;
    }

    let ignore = false;

    const loadBook = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [book, localCoverUrl] = await Promise.all([getBookById(id), getCoverPhotoUrl(id)]);

        if (ignore) {
          if (localCoverUrl) URL.revokeObjectURL(localCoverUrl);
          return;
        }

        if (!book) {
          setLoadError("Book not found. Return to the library and choose another book.");
          return;
        }

        if (localCoverObjectUrlRef.current) {
          URL.revokeObjectURL(localCoverObjectUrlRef.current);
        }
        localCoverObjectUrlRef.current = localCoverUrl;

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
        setCoverPhotoUrl(localCoverUrl);
        setFormSessionKey((currentKey) => currentKey + 1);
      } catch (error) {
        console.error("Failed to load book editor:", error);
        setLoadError(resolveErrorMessage(error));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadBook();

    return () => {
      ignore = true;
    };
  }, [id, isEditing]);

  useEffect(
    () => () => {
      if (localCoverObjectUrlRef.current) {
        URL.revokeObjectURL(localCoverObjectUrlRef.current);
      }
    },
    [],
  );

  const formInstanceKey = useMemo(
    () => `${isEditing ? `edit-${id}` : "add"}-${formSessionKey}`,
    [formSessionKey, id, isEditing],
  );

  const publishSaveState = useCallback((nextState: BookFormSaveState, message: string | null) => {
    setSaveState(nextState);
    setSaveMessage(message);
    setSaveSignal((currentSignal) => currentSignal + 1);
  }, []);

  const resolveSeriesId = useCallback(async (name: string) => {
    const existing = await findSeriesByName(name);
    if (existing) return existing.id;
    const created = await createSeries(name);
    return created.id;
  }, []);

  const syncBookSeries = useCallback(
    async (bookId: string) => {
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
    },
    [resolveSeriesId, seriesLabel, seriesName],
  );

  const handlePickCoverPhoto = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCoverPhotoCapture = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !id) return;
      try {
        await saveCoverPhoto(id, file);
        await updateBook(id, { coverUrl: null });
        setCoverUrl("");
        if (localCoverObjectUrlRef.current) {
          URL.revokeObjectURL(localCoverObjectUrlRef.current);
        }
        const nextCoverUrl = await getCoverPhotoUrl(id);
        localCoverObjectUrlRef.current = nextCoverUrl;
        setCoverPhotoUrl(nextCoverUrl);
        setShowCoverSaved(true);
        window.setTimeout(() => setShowCoverSaved(false), 2000);
        publishSaveState("success", "Local cover saved.");
      } catch (error) {
        console.error("Failed to save cover photo:", error);
        publishSaveState("error", resolveErrorMessage(error));
      }
      event.currentTarget.value = "";
    },
    [id, publishSaveState],
  );

  const handleRemoveCoverPhoto = useCallback(async () => {
    if (!id) return;
    try {
      await deleteCoverPhoto(id);
      if (localCoverObjectUrlRef.current) {
        URL.revokeObjectURL(localCoverObjectUrlRef.current);
        localCoverObjectUrlRef.current = null;
      }
      setCoverPhotoUrl(null);
      publishSaveState("success", "Local cover removed.");
    } catch (error) {
      console.error("Failed to remove local cover photo:", error);
      publishSaveState("error", resolveErrorMessage(error));
    }
  }, [id, publishSaveState]);

  const handleCoverUrlChange = useCallback(
    async (value: string) => {
      setCoverUrl(value);
      if (value.trim() && id && coverPhotoUrl) {
        try {
          await deleteCoverPhoto(id);
          if (localCoverObjectUrlRef.current) {
            URL.revokeObjectURL(localCoverObjectUrlRef.current);
            localCoverObjectUrlRef.current = null;
          }
          setCoverPhotoUrl(null);
        } catch (error) {
          console.error("Failed to clear local cover photo:", error);
          publishSaveState("error", resolveErrorMessage(error));
        }
      }
    },
    [coverPhotoUrl, id, publishSaveState],
  );

  const handleCancel = useCallback(() => {
    navigate(returnTo);
  }, [navigate, returnTo]);

  const handleBack = useCallback(() => {
    if (formIsDirty && !window.confirm("You have unsaved changes. Leave this editor without saving?")) {
      return;
    }
    navigate(returnTo);
  }, [formIsDirty, navigate, returnTo]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!title.trim() || !author.trim()) return;

      const normalizedTitle = title.trim();
      const payload = {
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
      };

      try {
        publishSaveState("saving", isEditing ? "Saving changes..." : "Saving new book...");
        let savedBook: Book;
        if (isEditing && id) {
          savedBook = await updateBook(id, payload);
        } else {
          savedBook = await addBook(payload);
        }
        await syncBookSeries(savedBook.id);
        publishSaveState("success", `Saved ${normalizedTitle}.`);
        const nextPath =
          searchParams.get("returnTo") && !returnTo.includes("/book/new")
            ? returnTo
            : `/book/${savedBook.id}`;
        navigate(nextPath, { replace: true });
      } catch (error) {
        console.error("Failed to save book:", error);
        publishSaveState("error", resolveErrorMessage(error));
      }
    },
    [
      author,
      coverUrl,
      description,
      finished,
      format,
      genre,
      id,
      isEditing,
      isbn,
      navigate,
      ownershipStatus,
      pages,
      publishSaveState,
      readByDane,
      readByEmma,
      returnTo,
      searchParams,
      syncBookSeries,
      title,
    ],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!id) return;
    try {
      setDeletePending(true);
      await deleteBook(id);
      const nextPath = returnTo === `/book/${id}` ? "/admin" : returnTo;
      navigate(nextPath, { replace: true });
    } catch (error) {
      console.error("Failed to delete book:", error);
      publishSaveState("error", resolveErrorMessage(error));
    } finally {
      setDeletePending(false);
      setDeleteDialogOpen(false);
    }
  }, [id, navigate, publishSaveState, returnTo]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-4">
        <LoadingState
          title={isEditing ? "Loading Editor" : "Preparing Editor"}
          description="Opening the book workflow."
          variant="detail"
          className="w-full"
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          to={returnTo}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 no-underline transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
        <div
          className="ds-panel-surface border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="book-editor-page">
      <div className="book-editor-page__floating-controls" aria-label="Editor actions">
        <button
          type="button"
          className="book-editor-page__icon-button"
          onClick={handleBack}
          aria-label="Back"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <BookForm
        isEditing={isEditing}
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
        showCoverPhotoControls={isEditing}
        coverPhotoInputRef={fileInputRef}
        saveState={saveState}
        saveMessage={saveMessage}
        saveSignal={saveSignal}
        formInstanceKey={formInstanceKey}
        onDirtyChange={setFormIsDirty}
        onCoverPhotoFileChange={handleCoverPhotoCapture}
        onCoverPhotoPick={handlePickCoverPhoto}
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
        onClearSeries={() => {
          setSeriesName("");
          setSeriesLabel("");
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDelete={isEditing ? () => setDeleteDialogOpen(true) : undefined}
      >
        {formIsDirty
          ? isEditing
            ? "Editing - Unsaved"
            : "Adding - Unsaved"
          : isEditing
            ? "Editing Book"
            : "Adding Book"}
      </BookForm>

      <ManageDeleteDialog
        open={deleteDialogOpen}
        title={title || "Untitled"}
        busy={deletePending}
        onCancel={() => {
          if (!deletePending) setDeleteDialogOpen(false);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

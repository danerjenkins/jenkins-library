import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  addBoardGame,
  deleteBook,
  getBoardGameById,
  updateBook,
} from "../../../data/bookRepo";
import {
  isBookCoverPhotoUrl,
  removeBookCoverPhoto,
  uploadBookCoverPhoto,
} from "../../../repos/coverStorageRepo";
import { LoadingState } from "../../../ui/components/LoadingState";
import type { Book } from "../lib/bookTypes";
import { BookForm, type BookFormSaveState } from "../forms/BookForm";
import type { BookFormSection } from "../forms/book-form/BookForm.types";
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

function resolveInitialSection(value: string | null): BookFormSection | undefined {
  if (value === "cover" || value === "summary" || value === "metadata" || value === "basics") {
    return value;
  }

  return undefined;
}

function numberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function BoardGameEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(id);
  const fallbackReturnPath = isEditing && id ? `/board-game/${id}` : "/board-games";
  const returnTo = resolveReturnTo(searchParams.get("returnTo"), fallbackReturnPath);
  const initialSection = resolveInitialSection(searchParams.get("section"));

  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [designer, setDesigner] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [publisher, setPublisher] = useState("");
  const [minPlayers, setMinPlayers] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [playTimeMinutes, setPlayTimeMinutes] = useState("");
  const [minAge, setMinAge] = useState("");
  const [complexity, setComplexity] = useState("");
  const [ownershipStatus, setOwnershipStatus] = useState<"owned" | "wishlist">(
    searchParams.get("ownership") === "wishlist" ? "wishlist" : "owned",
  );
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

    const loadBoardGame = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const boardGame = await getBoardGameById(id);

        if (ignore) {
          return;
        }

        if (!boardGame) {
          setLoadError("Board game not found. Return to board games and choose another game.");
          return;
        }

        setTitle(boardGame.title);
        setDesigner(boardGame.author);
        setCategory(boardGame.category || boardGame.genre || "");
        setDescription(boardGame.description || "");
        setCoverUrl(boardGame.coverUrl || "");
        setPublisher(boardGame.publisher || "");
        setMinPlayers(boardGame.minPlayers?.toString() || "");
        setMaxPlayers(boardGame.maxPlayers?.toString() || "");
        setPlayTimeMinutes(boardGame.playTimeMinutes?.toString() || "");
        setMinAge(boardGame.minAge?.toString() || "");
        setComplexity(boardGame.complexity?.toString() || "");
        setOwnershipStatus(boardGame.ownershipStatus ?? "owned");
        setCoverPhotoUrl(isBookCoverPhotoUrl(boardGame.coverUrl) ? (boardGame.coverUrl ?? null) : null);
        setFormSessionKey((currentKey) => currentKey + 1);
      } catch (error) {
        console.error("Failed to load board game editor:", error);
        setLoadError(resolveErrorMessage(error));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadBoardGame();

    return () => {
      ignore = true;
    };
  }, [id, isEditing]);

  const formInstanceKey = useMemo(
    () => `${isEditing ? `edit-board-game-${id}` : "add-board-game"}-${formSessionKey}`,
    [formSessionKey, id, isEditing],
  );

  const publishSaveState = useCallback((nextState: BookFormSaveState, message: string | null) => {
    setSaveState(nextState);
    setSaveMessage(message);
    setSaveSignal((currentSignal) => currentSignal + 1);
  }, []);

  const handlePickCoverPhoto = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCoverPhotoCapture = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !id) return;
      let uploadedCoverUrl: string | null = null;
      let savedUploadedCover = false;
      try {
        const previousCoverPhotoUrl = coverPhotoUrl;
        const nextCoverUrl = await uploadBookCoverPhoto(id, file);
        uploadedCoverUrl = nextCoverUrl;
        await updateBook(id, { coverUrl: nextCoverUrl });
        savedUploadedCover = true;
        if (previousCoverPhotoUrl && previousCoverPhotoUrl !== nextCoverUrl) {
          await removeBookCoverPhoto(previousCoverPhotoUrl);
        }
        setCoverUrl(nextCoverUrl);
        setCoverPhotoUrl(nextCoverUrl);
        setShowCoverSaved(true);
        window.setTimeout(() => setShowCoverSaved(false), 2000);
        publishSaveState("success", "Image saved.");
      } catch (error) {
        if (uploadedCoverUrl && !savedUploadedCover) {
          await removeBookCoverPhoto(uploadedCoverUrl).catch((removeError) => {
            console.error("Failed to roll back uploaded image:", removeError);
          });
        }
        console.error("Failed to save board game image:", error);
        publishSaveState("error", resolveErrorMessage(error));
      }
      event.currentTarget.value = "";
    },
    [coverPhotoUrl, id, publishSaveState],
  );

  const handleRemoveCoverPhoto = useCallback(async () => {
    if (!id) return;
    try {
      await removeBookCoverPhoto(coverPhotoUrl);
      await updateBook(id, { coverUrl: null });
      setCoverUrl("");
      setCoverPhotoUrl(null);
      publishSaveState("success", "Image removed.");
    } catch (error) {
      console.error("Failed to remove board game image:", error);
      publishSaveState("error", resolveErrorMessage(error));
    }
  }, [coverPhotoUrl, id, publishSaveState]);

  const handleCoverUrlChange = useCallback(
    async (value: string) => {
      const previousCoverPhotoUrl = coverPhotoUrl;
      setCoverUrl(value);
      if (value.trim() && id && previousCoverPhotoUrl && value.trim() !== previousCoverPhotoUrl) {
        try {
          await removeBookCoverPhoto(previousCoverPhotoUrl);
          setCoverPhotoUrl(null);
        } catch (error) {
          console.error("Failed to clear uploaded board game image:", error);
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
      if (!title.trim() || !designer.trim()) return;

      const normalizedTitle = title.trim();
      const normalizedCategory = category.trim() || null;
      const payload = {
        title: normalizedTitle,
        author: designer.trim(),
        genre: normalizedCategory,
        description: description.trim() || null,
        coverUrl: coverUrl.trim() || null,
        ownershipStatus,
        mediaType: "board_game" as const,
        publisher: publisher.trim() || null,
        minPlayers: numberOrNull(minPlayers),
        maxPlayers: numberOrNull(maxPlayers),
        playTimeMinutes: numberOrNull(playTimeMinutes),
        minAge: numberOrNull(minAge),
        complexity: numberOrNull(complexity),
        category: normalizedCategory,
      };

      try {
        publishSaveState("saving", isEditing ? "Saving changes..." : "Saving new board game...");
        let savedBoardGame: Book;
        if (isEditing && id) {
          savedBoardGame = await updateBook(id, payload);
        } else {
          savedBoardGame = await addBoardGame(payload);
        }
        publishSaveState("success", `Saved ${normalizedTitle}.`);
        const nextPath =
          searchParams.get("returnTo") && !returnTo.includes("/board-game/new")
            ? returnTo
            : `/board-game/${savedBoardGame.id}`;
        navigate(nextPath, { replace: true });
      } catch (error) {
        console.error("Failed to save board game:", error);
        publishSaveState("error", resolveErrorMessage(error));
      }
    },
    [
      category,
      complexity,
      coverUrl,
      description,
      designer,
      id,
      isEditing,
      maxPlayers,
      minAge,
      minPlayers,
      navigate,
      ownershipStatus,
      playTimeMinutes,
      publishSaveState,
      publisher,
      returnTo,
      searchParams,
      title,
    ],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!id) return;
    try {
      setDeletePending(true);
      await deleteBook(id);
      const nextPath = returnTo === `/board-game/${id}` ? "/board-games" : returnTo;
      navigate(nextPath, { replace: true });
    } catch (error) {
      console.error("Failed to delete board game:", error);
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
          description="Opening the board game workflow."
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
        mediaType="board_game"
        isEditing={isEditing}
        title={title}
        author={designer}
        genre={category}
        description={description}
        isbn=""
        finished={false}
        coverUrl={coverUrl}
        format=""
        pages=""
        readByDane={false}
        readByEmma={false}
        ownershipStatus={ownershipStatus}
        seriesName=""
        seriesLabel=""
        publisher={publisher}
        minPlayers={minPlayers}
        maxPlayers={maxPlayers}
        playTimeMinutes={playTimeMinutes}
        minAge={minAge}
        complexity={complexity}
        category={category}
        coverPhotoUrl={coverPhotoUrl}
        showCoverSaved={showCoverSaved}
        showCoverPhotoControls={isEditing}
        coverPhotoInputRef={fileInputRef}
        saveState={saveState}
        saveMessage={saveMessage}
        saveSignal={saveSignal}
        formInstanceKey={formInstanceKey}
        initialSection={initialSection}
        onDirtyChange={setFormIsDirty}
        onCoverPhotoFileChange={handleCoverPhotoCapture}
        onCoverPhotoPick={handlePickCoverPhoto}
        onRemoveCoverPhoto={handleRemoveCoverPhoto}
        onTitleChange={setTitle}
        onAuthorChange={setDesigner}
        onGenreChange={setCategory}
        onDescriptionChange={setDescription}
        onIsbnChange={() => undefined}
        onFinishedChange={() => undefined}
        onCoverUrlChange={handleCoverUrlChange}
        onFormatChange={() => undefined}
        onPagesChange={() => undefined}
        onReadByDaneChange={() => undefined}
        onReadByEmmaChange={() => undefined}
        onOwnershipStatusChange={setOwnershipStatus}
        onSeriesNameChange={() => undefined}
        onSeriesLabelChange={() => undefined}
        onClearSeries={() => undefined}
        onPublisherChange={setPublisher}
        onMinPlayersChange={setMinPlayers}
        onMaxPlayersChange={setMaxPlayers}
        onPlayTimeMinutesChange={setPlayTimeMinutes}
        onMinAgeChange={setMinAge}
        onComplexityChange={setComplexity}
        onCategoryChange={setCategory}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDelete={isEditing ? () => setDeleteDialogOpen(true) : undefined}
      >
        {formIsDirty
          ? isEditing
            ? "Editing - Unsaved"
            : "Adding - Unsaved"
          : isEditing
            ? "Editing Board Game"
            : "Adding Board Game"}
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

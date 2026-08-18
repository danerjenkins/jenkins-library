import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  checkOutBook,
  deleteCurrentUserReview,
  getBoardGameById,
  returnBook,
  updateBook,
  upsertCurrentUserReview,
} from "../../../data/bookRepo";
import { LoadingState } from "../../../ui/components/LoadingState";
import type { Book } from "../lib/bookTypes";
import { BookDetailContent, type MetadataSummaryItem } from "../sections/BookDetailSections";
import { useLibrary } from "../../libraries/useLibrary";

export function BoardGameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeMember, canEdit, members } = useLibrary();
  const [boardGame, setBoardGame] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingOwnership, setSavingOwnership] = useState(false);
  const [ownershipError, setOwnershipError] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [savingCheckout, setSavingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate("/board-games");
      return;
    }

    let ignore = false;

    const loadBoardGame = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const boardGameData = await getBoardGameById(id);
        if (!boardGameData) {
          navigate("/board-games");
          return;
        }

        if (!ignore) {
          setBoardGame(boardGameData);
        }
      } catch (error) {
        console.error("Failed to load board game:", error);
        setErrorMessage(
          "Board game details could not load. Return to board games and try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadBoardGame();

    return () => {
      ignore = true;
    };
  }, [id, navigate]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [],
  );

  const isWishlistBoardGame =
    (boardGame?.ownershipStatus ?? "owned") === "wishlist";

  const metadataSummary = useMemo<MetadataSummaryItem[]>(() => {
    if (!boardGame) {
      return [];
    }

    const items: MetadataSummaryItem[] = [];

    if (boardGame.publisher) {
      items.push({ label: "Publisher", value: boardGame.publisher });
    }

    if (boardGame.minPlayers && boardGame.maxPlayers) {
      items.push({
        label: "Players",
        value:
          boardGame.minPlayers === boardGame.maxPlayers
            ? String(boardGame.minPlayers)
            : `${boardGame.minPlayers}-${boardGame.maxPlayers}`,
      });
    }

    if (boardGame.playTimeMinutes) {
      items.push({
        label: "Play Time",
        value: `${boardGame.playTimeMinutes} min`,
      });
    }

    if (boardGame.minAge !== null && boardGame.minAge !== undefined) {
      items.push({ label: "Ages", value: `${boardGame.minAge}+` });
    }

    if (boardGame.complexity !== null && boardGame.complexity !== undefined) {
      items.push({ label: "Complexity", value: `${boardGame.complexity}/5` });
    }

    if (boardGame.category ?? boardGame.genre) {
      items.push({
        label: "Category",
        value: boardGame.category ?? boardGame.genre ?? "",
      });
    }

    return items;
  }, [boardGame]);

  const handleBackNavigation = () => {
    const historyState = window.history.state as { idx?: number } | null;
    if (typeof historyState?.idx === "number" && historyState.idx > 0) {
      navigate(-1);
      return;
    }

    if (
      typeof location.state === "object" &&
      location.state !== null &&
      "from" in location.state &&
      typeof location.state.from === "string"
    ) {
      navigate(location.state.from);
      return;
    }

    navigate("/board-games");
  };

  const handleOwnershipChange = async (
    nextOwnershipStatus: "owned" | "wishlist",
  ) => {
    if (!boardGame || !canEdit) return;

    const previousBoardGame = boardGame;
    const nextBoardGame = { ...boardGame, ownershipStatus: nextOwnershipStatus };

    setBoardGame(nextBoardGame);
    setSavingOwnership(true);
    setOwnershipError(null);

    try {
      const updatedBoardGame = await updateBook(boardGame.id, {
        ownershipStatus: nextOwnershipStatus,
      });
      setBoardGame(updatedBoardGame);
    } catch (error) {
      console.error("Failed to update board game ownership:", error);
      setBoardGame(previousBoardGame);
      setOwnershipError("Ownership could not be saved. Try again.");
    } finally {
      setSavingOwnership(false);
    }
  };

  const handleReviewSave = async (rating: number, review: string) => {
    if (!boardGame || !activeMember) return;

    setSavingReview(true);
    setReviewError(null);

    try {
      await upsertCurrentUserReview(boardGame.id, rating, review);
      const updatedBoardGame = await getBoardGameById(boardGame.id);
      setBoardGame(updatedBoardGame ?? boardGame);
    } catch (error) {
      console.error("Failed to save board game review:", error);
      setReviewError("Review could not be saved. Try again.");
    } finally {
      setSavingReview(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!boardGame || !activeMember) return;

    setSavingReview(true);
    setReviewError(null);

    try {
      await deleteCurrentUserReview(boardGame.id);
      const updatedBoardGame = await getBoardGameById(boardGame.id);
      setBoardGame(updatedBoardGame ?? boardGame);
    } catch (error) {
      console.error("Failed to delete board game review:", error);
      setReviewError("Review could not be deleted. Try again.");
    } finally {
      setSavingReview(false);
    }
  };

  const handleCheckoutSave = async ({
    borrowerMemberId,
    borrowerName,
  }: {
    borrowerMemberId: string | null;
    borrowerName: string;
  }) => {
    if (!boardGame || !canEdit) return;

    setSavingCheckout(true);
    setCheckoutError(null);

    try {
      await checkOutBook({
        bookId: boardGame.id,
        borrowerMemberId,
        borrowerName,
      });
      const updatedBoardGame = await getBoardGameById(boardGame.id);
      setBoardGame(updatedBoardGame ?? boardGame);
    } catch (error) {
      console.error("Failed to check out board game:", error);
      setCheckoutError("Checkout could not be saved. Try again.");
    } finally {
      setSavingCheckout(false);
    }
  };

  const handleReturnBook = async () => {
    if (!boardGame?.activeCheckout || !canEdit) return;

    setSavingCheckout(true);
    setCheckoutError(null);

    try {
      await returnBook(boardGame.activeCheckout.id);
      const updatedBoardGame = await getBoardGameById(boardGame.id);
      setBoardGame(updatedBoardGame ?? { ...boardGame, activeCheckout: null });
    } catch (error) {
      console.error("Failed to return board game:", error);
      setCheckoutError("Return could not be saved. Try again.");
    } finally {
      setSavingCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-4">
        <LoadingState
          title="Loading Board Game Details"
          description="Fetching the record, image, and game controls."
          variant="detail"
          className="w-full"
        />
      </div>
    );
  }

  if (errorMessage || !boardGame) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBackNavigation}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <div
          className="ds-panel-surface border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {errorMessage ??
            "Board game not found. Return to board games and choose another game."}
        </div>
      </div>
    );
  }

  return (
    <BookDetailContent
      key={[
        boardGame.id,
        boardGame.currentUserReview?.updatedAt ?? "no-review",
        boardGame.activeCheckout?.id ?? "no-checkout",
      ].join(":")}
      book={boardGame}
      canEdit={canEdit}
      isWishlistBook={isWishlistBoardGame}
      backLabel="Back to Board Games"
      metadataSummary={metadataSummary}
      queuedReaders={{}}
      members={members}
      activeMember={activeMember}
      savingReadStatus={false}
      readStatusError={null}
      savingOwnership={savingOwnership}
      ownershipError={ownershipError}
      savingReview={savingReview}
      reviewError={reviewError}
      savingCheckout={savingCheckout}
      checkoutError={checkoutError}
      dateFormatter={dateFormatter}
      onBack={handleBackNavigation}
      onReadStatusChange={() => undefined}
      onOwnershipChange={handleOwnershipChange}
      onAddToReadingList={() => undefined}
      onReviewSave={handleReviewSave}
      onReviewDelete={handleReviewDelete}
      onCheckoutSave={handleCheckoutSave}
      onReturnBook={handleReturnBook}
    />
  );
}

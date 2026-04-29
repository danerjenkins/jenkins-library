import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getBookById, updateBook } from "../../../data/bookRepo";
import { getCoverPhotoUrl } from "../../../data/db";
import { LoadingState } from "../../../ui/components/LoadingState";
import type { Book } from "../lib/bookTypes";
import { BOOK_FORMAT_LABELS } from "../lib/bookTypes";
import type { ReaderId } from "../lib/readingListPreferences";
import {
  addBookToReadingList,
  getReadingListQueues,
} from "../../../repos/readingListRepo";
import { BookDetailContent, type MetadataSummaryItem } from "../sections/BookDetailSections";

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);
  const [savingReadStatus, setSavingReadStatus] = useState(false);
  const [readStatusError, setReadStatusError] = useState<string | null>(null);
  const [savingOwnership, setSavingOwnership] = useState(false);
  const [ownershipError, setOwnershipError] = useState<string | null>(null);
  const [readingListQueues, setReadingListQueues] = useState<Record<ReaderId, string[]>>({
    dane: [],
    emma: [],
  });

  useEffect(() => {
    if (!id) {
      navigate("/view");
      return;
    }

    let objectUrl: string | null = null;
    let ignore = false;

    const loadBook = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        const [bookData, queues] = await Promise.all([
          getBookById(id),
          getReadingListQueues(),
        ]);
        if (!bookData) {
          navigate("/view");
          return;
        }

        if (ignore) {
          return;
        }

        setBook(bookData);
        setReadingListQueues(queues);

        const coverUrl = await getCoverPhotoUrl(id);
        objectUrl = coverUrl;
        setLocalCoverUrl(coverUrl);
      } catch (error) {
        console.error("Failed to load book:", error);
        setErrorMessage(
          "Book details could not load. Return to the library and try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadBook();

    return () => {
      ignore = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
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

  const isWishlistBook = (book?.ownershipStatus ?? "owned") === "wishlist";
  const backPath = isWishlistBook ? "/wishlist" : "/view";
  const backLabel = isWishlistBook ? "Back to Wishlist" : "Back to Library";

  const metadataSummary = useMemo<MetadataSummaryItem[]>(() => {
    if (!book) {
      return [];
    }

    const items: MetadataSummaryItem[] = [];

    if (book.format) {
      items.push({
        label: "Format",
        value: BOOK_FORMAT_LABELS[book.format],
      });
    }

    if (book.pages) {
      items.push({
        label: "Pages",
        value: String(book.pages),
      });
    }

    if (book.genre) {
      items.push({
        label: "Genre",
        value: book.genre,
      });
    }

    return items;
  }, [book]);

  const queuedReaders = useMemo(() => {
    if (!book) {
      return { dane: false, emma: false };
    }

    return {
      dane: readingListQueues.dane.includes(book.id),
      emma: readingListQueues.emma.includes(book.id),
    };
  }, [book, readingListQueues]);

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

    navigate(backPath);
  };

  const handleReadStatusChange = async (
    field: "readByDane" | "readByEmma",
    checked: boolean,
  ) => {
    if (!book) return;

    const previousBook = book;
    const nextBook = { ...book, [field]: checked };

    setBook(nextBook);
    setSavingReadStatus(true);
    setReadStatusError(null);

    try {
      const updatedBook = await updateBook(book.id, {
        [field]: checked,
      });
      setBook(updatedBook);
    } catch (error) {
      console.error("Failed to update read status:", error);
      setBook(previousBook);
      setReadStatusError("Read status could not be saved. Try again.");
    } finally {
      setSavingReadStatus(false);
    }
  };

  const handleOwnershipChange = async (
    nextOwnershipStatus: "owned" | "wishlist",
  ) => {
    if (!book) return;

    const previousBook = book;
    const nextBook = { ...book, ownershipStatus: nextOwnershipStatus };

    setBook(nextBook);
    setSavingOwnership(true);
    setOwnershipError(null);

    try {
      const updatedBook = await updateBook(book.id, {
        ownershipStatus: nextOwnershipStatus,
      });
      setBook(updatedBook);
    } catch (error) {
      console.error("Failed to update ownership:", error);
      setBook(previousBook);
      setOwnershipError("Ownership could not be saved. Try again.");
    } finally {
      setSavingOwnership(false);
    }
  };

  const handleAddToReadingList = (readerId: ReaderId) => {
    if (!book) return;

    void addBookToReadingList(readerId, book.id)
      .then((nextQueueIds) => {
        setReadingListQueues((current) => ({
          ...current,
          [readerId]: nextQueueIds,
        }));
      })
      .catch((error) => {
        console.error("Failed to update reading list:", error);
      });
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-4">
        <LoadingState
          title="Loading Book Details"
          description="Fetching the record, cover, and reading controls."
          variant="detail"
          className="w-full"
        />
      </div>
    );
  }

  if (errorMessage || !book) {
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
            "Book not found. Return to the library and choose another book."}
        </div>
      </div>
    );
  }

  return (
    <BookDetailContent
      book={book}
      localCoverUrl={localCoverUrl}
      isWishlistBook={isWishlistBook}
      backLabel={backLabel}
      metadataSummary={metadataSummary}
      queuedReaders={queuedReaders}
      savingReadStatus={savingReadStatus}
      readStatusError={readStatusError}
      savingOwnership={savingOwnership}
      ownershipError={ownershipError}
      dateFormatter={dateFormatter}
      onBack={handleBackNavigation}
      onReadStatusChange={handleReadStatusChange}
      onOwnershipChange={handleOwnershipChange}
      onAddToReadingList={handleAddToReadingList}
    />
  );
}

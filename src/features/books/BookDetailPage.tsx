import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit } from "lucide-react";
import { getBookById, updateBook } from "../../data/bookRepo";
import { getCoverPhotoUrl } from "../../data/db";
import { LoadingState } from "../../ui/components/LoadingState";
import type { Book } from "./bookTypes";
import { BOOK_FORMAT_LABELS } from "./bookTypes";
import { Badge } from "../../ui/components/Badge";
import { Button } from "../../ui/components/Button";
import type { ReaderId } from "./readingListPreferences";
import {
  addBookToReadingList,
  getReadingListQueues,
} from "../../repos/readingListRepo";

type MetadataSummaryItem = {
  label: string;
  value: string;
};

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
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {errorMessage ??
            "Book not found. Return to the library and choose another book."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleBackNavigation}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-warm-gray bg-cream/95 shadow-soft">
        <div className="grid gap-6 p-6 md:grid-cols-3">
          <div className="md:col-span-1">
            {localCoverUrl || book.coverUrl ? (
              <img
                src={localCoverUrl ?? book.coverUrl ?? undefined}
                alt={`Cover of ${book.title}`}
                className="aspect-[2/3] w-full rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-warm-gray-light text-stone-500 shadow-md">
                <span
                  className="rounded-full border border-warm-gray bg-cream px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em]"
                  aria-hidden="true"
                >
                  No Cover
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4 md:col-span-2">
            <div>
              <h1 className="font-display text-3xl font-bold text-stone-900">
                {book.title}
              </h1>
              <p className="mt-2 font-sans text-lg text-stone-600">
                {book.author}
              </p>
              {book.description ? (
                <p className="mt-4 font-sans leading-relaxed text-stone-700">
                  {book.description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={isWishlistBook ? "amber" : "default"}>
                {isWishlistBook ? "Wishlist" : "Owned"}
              </Badge>
              {book.finished ? <Badge variant="success">Finished</Badge> : null}
              {book.readByDane ? (
                <Badge variant="amber">Read by Dane</Badge>
              ) : null}
              {book.readByEmma ? (
                <Badge variant="amber">Read by Emma</Badge>
              ) : null}
              {!book.readByDane && !book.readByEmma ? (
                <Badge variant="amber">To Read</Badge>
              ) : null}
            </div>

            {metadataSummary.length > 0 ? (
              <section className="rounded-xl border border-warm-gray/80 bg-stone-50/70 p-4">
                <div>
                  <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">
                    Metadata
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    Quick facts for scanning this book at a glance.
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {metadataSummary.map((item) => (
                    <div
                      key={item.label}
                      className="min-w-28 rounded-lg border border-warm-gray bg-cream px-3 py-2"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-stone-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-xl border border-warm-gray/80 bg-parchment/75 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">
                    Reading
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    Mark who has read this book and add it to a reader's next-up list.
                  </p>
                </div>
                <div className="text-xs text-stone-500" aria-live="polite">
                  {savingReadStatus
                    ? "Saving read status..."
                    : queuedReaders.dane || queuedReaders.emma
                      ? "Queued"
                      : "Saved"}
                </div>
              </div>

              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-warm-gray bg-cream p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
                    Read status
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label
                      htmlFor="detail-read-dane"
                      className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-warm-gray-light"
                    >
                      <input
                        id="detail-read-dane"
                        name="detailReadByDane"
                        type="checkbox"
                        checked={book.readByDane}
                        disabled={savingReadStatus}
                        onChange={(event) =>
                          void handleReadStatusChange(
                            "readByDane",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
                      />
                      Dane
                    </label>

                    <label
                      htmlFor="detail-read-emma"
                      className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md border border-warm-gray bg-cream px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-warm-gray-light"
                    >
                      <input
                        id="detail-read-emma"
                        name="detailReadByEmma"
                        type="checkbox"
                        checked={book.readByEmma}
                        disabled={savingReadStatus}
                        onChange={(event) =>
                          void handleReadStatusChange(
                            "readByEmma",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
                      />
                      Emma
                    </label>
                  </div>

                  {readStatusError ? (
                    <p className="mt-2 text-xs text-rose-700" role="alert">
                      {readStatusError}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-warm-gray bg-cream p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
                    To read
                  </h3>
                  <p className="mt-1 text-xs text-stone-500">
                    Add this book to a reader's next-up list.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { readerId: "dane" as const, label: "Dane" },
                      { readerId: "emma" as const, label: "Emma" },
                    ].map(({ readerId, label }) => {
                      const queued = queuedReaders[readerId];
                      return (
                        <Button
                          key={readerId}
                          type="button"
                          variant={queued ? "secondary" : "primary"}
                          onClick={() => handleAddToReadingList(readerId)}
                        >
                          {queued ? "Move to top for " : "Add to "}{label}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant={isWishlistBook ? "amber" : "default"}>
                      {isWishlistBook ? "Wishlist book" : "Library book"}
                    </Badge>
                    {queuedReaders.dane ? <Badge variant="success">Queued for Dane</Badge> : null}
                    {queuedReaders.emma ? <Badge variant="success">Queued for Emma</Badge> : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-warm-gray/80 bg-parchment/75 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">
                    Ownership
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {isWishlistBook
                      ? "Move this book into the library when you own it."
                      : "Move this book to the wishlist when you no longer own it."}
                  </p>
                </div>
                <div className="text-xs text-stone-500" aria-live="polite">
                  {savingOwnership ? "Saving..." : "Saved"}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-stone-600">
                  Current shelf:{" "}
                  <span className="font-semibold text-stone-900">
                    {isWishlistBook ? "Wishlist" : "Library"}
                  </span>
                </p>
                <Button
                  type="button"
                  variant={isWishlistBook ? "success" : "secondary"}
                  disabled={savingOwnership}
                  onClick={() =>
                    void handleOwnershipChange(
                      isWishlistBook ? "owned" : "wishlist",
                    )
                  }
                >
                  {isWishlistBook ? "Add To Library" : "Move To Wishlist"}
                </Button>
              </div>

              {ownershipError ? (
                <p className="mt-2 text-xs text-rose-700" role="alert">
                  {ownershipError}
                </p>
              ) : null}
            </section>

            <section className="rounded-xl border border-warm-gray/80 bg-stone-50/70 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">
                    Edit Details
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    Open the admin form to update metadata, notes, or cover info.
                  </p>
                </div>
                <Link
                  to={`/admin?edit=${book.id}&ownership=${
                    isWishlistBook ? "wishlist" : "owned"
                  }`}
                >
                  <Button variant="secondary">
                    <span className="flex items-center gap-2">
                      <Edit className="h-4 w-4" aria-hidden="true" />
                      Edit Book
                    </span>
                  </Button>
                </Link>
              </div>
            </section>

            <div className="space-y-3 border-t border-warm-gray pt-4">
              {book.genre ? (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    Genre:
                  </span>
                  <p className="mt-1 text-stone-900">{book.genre}</p>
                </div>
              ) : null}

              {book.isbn ? (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    ISBN:
                  </span>
                  <p className="mt-1 font-mono text-sm text-stone-900">
                    {book.isbn}
                  </p>
                </div>
              ) : null}

              {book.format ? (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    Format:
                  </span>
                  <p className="mt-1 text-stone-900">
                    {BOOK_FORMAT_LABELS[book.format]}
                  </p>
                </div>
              ) : null}

              {book.pages ? (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    Pages:
                  </span>
                  <p className="mt-1 text-stone-900">{book.pages}</p>
                </div>
              ) : null}

              <div>
                <span className="text-sm font-semibold text-stone-500">
                  Added:
                </span>
                <p className="mt-1 text-stone-900">
                  {dateFormatter.format(new Date(book.createdAt))}
                </p>
              </div>

              <div>
                <span className="text-sm font-semibold text-stone-500">
                  Last Updated:
                </span>
                <p className="mt-1 text-stone-900">
                  {dateFormatter.format(new Date(book.updatedAt))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

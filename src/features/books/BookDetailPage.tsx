import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit } from "lucide-react";
import { getBookById, updateBook } from "../../data/bookRepo";
import { getCoverPhotoUrl } from "../../data/db";
import type { Book } from "./bookTypes";
import { Badge } from "../../ui/components/Badge";
import { BOOK_FORMAT_LABELS } from "./bookTypes";
import { Button } from "../../ui/components/Button";

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);
  const [savingReadStatus, setSavingReadStatus] = useState(false);
  const [readStatusError, setReadStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate("/view");
      return;
    }

    let objectUrl: string | null = null;

    const loadBook = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const bookData = await getBookById(id);
        if (!bookData) {
          navigate("/view");
          return;
        }
        setBook(bookData);

        // Load cover photo
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

    loadBook();

    // Cleanup
    return () => {
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="rounded-xl border border-warm-gray bg-cream/90 px-4 py-3 text-sm text-stone-500 shadow-sm"
          aria-live="polite"
        >
          Loading book details…
        </div>
      </div>
    );
  }

  if (errorMessage || !book) {
    return (
      <div className="space-y-4">
        <Link
          to="/view"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Library
        </Link>
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
        <Link
          to="/view"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Library
        </Link>
      </div>

      <div className="rounded-2xl border border-warm-gray bg-cream/95 shadow-soft overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-3">
          {/* Cover Image */}
          <div className="md:col-span-1">
            {localCoverUrl || book.coverUrl ? (
              <img
                src={localCoverUrl || book.coverUrl!}
                alt={`Cover of ${book.title}`}
                className="aspect-[2/3] w-full rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-warm-gray-light text-stone-400 shadow-md">
                <span className="text-6xl">📚</span>
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-stone-900">
                {book.title}
              </h1>
              <p className="font-sans mt-2 text-lg text-stone-600">
                {book.author}
              </p>
              {book.description && (
                <p className="font-sans mt-4 text-stone-700 leading-relaxed">
                  {book.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {book.finished && <Badge variant="success">Finished</Badge>}
              {book.readByDane && <Badge variant="amber">Read by Dane</Badge>}
              {book.readByEmma && <Badge variant="amber">Read by Emma</Badge>}
              {!book.readByDane && !book.readByEmma && (
                <Badge variant="amber">To Read</Badge>
              )}
            </div>

            <section className="rounded-xl border border-warm-gray bg-parchment/75 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-sans text-sm font-semibold text-stone-800">
                    Read Status
                  </h2>
                  <p className="text-xs text-stone-500">
                    Mark who has read this book.
                  </p>
                </div>
                <div
                  className="text-xs text-stone-500"
                  aria-live="polite"
                >
                  {savingReadStatus ? "Saving…" : "Saved"}
                </div>
              </div>

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

              {readStatusError && (
                <p className="mt-2 text-xs text-rose-700" role="alert">
                  {readStatusError}
                </p>
              )}
            </section>

            <div className="space-y-3 pt-4 border-t border-warm-gray">
              {book.genre && (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    Genre:
                  </span>
                  <p className="text-stone-900 mt-1">{book.genre}</p>
                </div>
              )}

              {book.isbn && (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    ISBN:
                  </span>
                  <p className="text-stone-900 mt-1 font-mono text-sm">
                    {book.isbn}
                  </p>
                </div>
              )}

              {book.format && (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    Format:
                  </span>
                  <p className="text-stone-900 mt-1">
                    {BOOK_FORMAT_LABELS[book.format]}
                  </p>
                </div>
              )}

              {book.pages && (
                <div>
                  <span className="text-sm font-semibold text-stone-500">
                    Pages:
                  </span>
                  <p className="text-stone-900 mt-1">{book.pages}</p>
                </div>
              )}

              <div>
                <span className="text-sm font-semibold text-stone-500">
                  Added:
                </span>
                <p className="text-stone-900 mt-1">
                  {dateFormatter.format(new Date(book.createdAt))}
                </p>
              </div>

              <div>
                <span className="text-sm font-semibold text-stone-500">
                  Last Updated:
                </span>
                <p className="text-stone-900 mt-1">
                  {dateFormatter.format(new Date(book.updatedAt))}
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link to={`/admin?edit=${book.id}`}>
                <Button variant="secondary">
                  <span className="flex items-center gap-2">
                    <Edit className="h-4 w-4" aria-hidden="true" />
                    Edit Book
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

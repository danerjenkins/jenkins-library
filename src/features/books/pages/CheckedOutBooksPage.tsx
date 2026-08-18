import { useEffect, useMemo, useState } from "react";
import { BookCheck, ExternalLink, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { getCheckedOutBooks, returnBook } from "../../../data/bookRepo";
import { Button } from "../../../ui/components/Button";
import { LoadingState } from "../../../ui/components/LoadingState";
import { FullBleedPageHero, PageLayout, PageSection } from "../../../ui/components/PageLayout";
import { BookShelfState } from "../components/cards/BookCard";

type CheckedOutBookItem = Awaited<ReturnType<typeof getCheckedOutBooks>>[number];

function getFallbackMonogram(title: string): string {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  }

  return title.slice(0, 2).toUpperCase();
}

function CheckoutRow({
  item,
  dateFormatter,
  isReturning,
  onReturn,
}: {
  item: CheckedOutBookItem;
  dateFormatter: Intl.DateTimeFormat;
  isReturning: boolean;
  onReturn: (checkoutId: string) => void;
}) {
  const { book, checkout } = item;

  return (
    <li className="rounded-2xl border border-warm-gray/70 bg-cream/95 p-3 shadow-sm">
      <div className="flex gap-3">
        <Link
          to={`/book/${book.id}`}
          className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          aria-label={`Open ${book.title}`}
        >
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              width={64}
              height={96}
              loading="lazy"
              decoding="async"
              className="h-24 w-16 rounded border border-warm-gray/50 bg-warm-gray-light object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-24 w-16 items-center justify-center rounded border border-warm-gray/50 bg-warm-gray-light text-xs font-semibold text-stone-400">
              {getFallbackMonogram(book.title)}
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                to={`/book/${book.id}`}
                className="block rounded-sm font-display text-lg font-semibold leading-tight text-stone-900 no-underline transition-colors duration-150 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                {book.title}
              </Link>
              <p className="mt-0.5 text-sm text-stone-600">{book.author}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="min-h-8 px-2.5! py-1.5! text-xs"
                disabled={isReturning}
                onClick={() => onReturn(checkout.id)}
              >
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  {isReturning ? "Returning" : "Returned"}
                </span>
              </Button>
              <Link
                to={`/book/${book.id}`}
                className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md border border-warm-gray bg-parchment/80 px-2.5 py-1.5 text-xs font-semibold text-stone-700 no-underline transition-colors hover:bg-warm-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/25"
              >
                Detail
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="ds-chip ds-chip--compact ds-chip--warm-gray">
              {checkout.borrowerName}
            </span>
            <span className="ds-chip ds-chip--compact ds-chip--warm-gray">
              {dateFormatter.format(new Date(checkout.checkedOutAt))}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

export function CheckedOutBooksPage() {
  const [items, setItems] = useState<CheckedOutBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [returningIds, setReturningIds] = useState<Set<string>>(new Set());

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [],
  );

  useEffect(() => {
    let ignore = false;

    async function loadCheckouts() {
      try {
        setLoading(true);
        setErrorMessage(null);
        const nextItems = await getCheckedOutBooks();
        if (!ignore) {
          setItems(nextItems);
        }
      } catch (error) {
        console.error("Failed to load checked out books:", error);
        if (!ignore) {
          setErrorMessage("Checked out books could not load. Try again.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadCheckouts();

    return () => {
      ignore = true;
    };
  }, []);

  const handleReturn = async (checkoutId: string) => {
    setReturningIds((current) => new Set(current).add(checkoutId));
    setErrorMessage(null);

    try {
      await returnBook(checkoutId);
      setItems((current) =>
        current.filter((item) => item.checkout.id !== checkoutId),
      );
    } catch (error) {
      console.error("Failed to return checked out book:", error);
      setErrorMessage("Book return could not be saved. Try again.");
    } finally {
      setReturningIds((current) => {
        const next = new Set(current);
        next.delete(checkoutId);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <FullBleedPageHero
        title="Checked Out"
        subtitle="The books currently away from the shelf, and who has them."
        backgroundImage="/readinglisthero.png"
      />

      <PageLayout>
      <PageSection className="ds-panel-shell">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-stone-900">
              Active Checkouts
            </h2>
            <p className="ds-subtle-text mt-1 text-sm">
              Mark books returned as they come back to the library.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-600">
            <BookCheck className="h-4 w-4" aria-hidden="true" />
            {items.length} {items.length === 1 ? "book" : "books"} checked out
          </span>
        </div>
      </PageSection>

      {errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-sm">
          {errorMessage}
        </section>
      ) : null}

      {loading ? (
        <LoadingState
          title="Loading Checkouts"
          description="Looking for books currently checked out."
          variant="shelf"
          cardCount={3}
        />
      ) : items.length > 0 ? (
        <PageSection className="ds-panel-shell">
          <ul className="space-y-3">
            {items.map((item) => (
              <CheckoutRow
                key={item.checkout.id}
                item={item}
                dateFormatter={dateFormatter}
                isReturning={returningIds.has(item.checkout.id)}
                onReturn={handleReturn}
              />
            ))}
          </ul>
        </PageSection>
      ) : (
        <PageSection className="ds-panel-shell">
          <BookShelfState
            title="No Books Checked Out"
            description="Checked-out books will appear here after they are recorded from a book detail page."
          />
        </PageSection>
      )}
      </PageLayout>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { getAllBooks } from "../../data/bookRepo";
import type { Book } from "./bookTypes";

export function StatsPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const allBooks = await getAllBooks();
        setBooks(allBooks);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load library stats.";
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const stats = useMemo(
    () =>
      books.reduce(
        (totals, book) => {
          totals.totalBooks += 1;
          if (book.finished) totals.finishedBooks += 1;
          if (book.readByDane) totals.readByDane += 1;
          if (book.readByEmma) totals.readByEmma += 1;
          if (book.readByDane && book.readByEmma) totals.readByBoth += 1;
          if (!book.readByDane && !book.readByEmma) totals.unreadBooks += 1;
          return totals;
        },
        {
          totalBooks: 0,
          finishedBooks: 0,
          readByDane: 0,
          readByEmma: 0,
          readByBoth: 0,
          unreadBooks: 0,
        },
      ),
    [books],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-warm-gray bg-cream/95 p-4 shadow-soft sm:p-6">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900">
            Library Statistics
          </h2>
          <p className="font-sans mt-2 text-sm leading-relaxed text-stone-600">
            Overview of your collection and reading progress.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-warm-gray bg-cream/90 p-4 shadow-soft sm:p-6">
        {loading ? (
          <div
            className="rounded-xl border border-warm-gray bg-cream px-4 py-6 text-center text-sm text-stone-500"
            aria-live="polite"
          >
            Loading stats…
          </div>
        ) : errorMessage ? (
          <div
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : stats.totalBooks === 0 ? (
          <div className="rounded-xl border border-dashed border-warm-gray bg-parchment/75 px-4 py-10 text-center text-sm text-stone-600">
            <p className="font-medium">No stats yet</p>
            <p className="mt-1 text-xs text-stone-500">
              Add books to see collection and reading progress.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 text-sm text-stone-700 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-warm-gray bg-cream px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Total Books
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.totalBooks}
              </div>
            </div>
            <div className="rounded-xl border border-warm-gray bg-cream px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Finished
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.finishedBooks}
              </div>
            </div>
            <div className="rounded-xl border border-warm-gray bg-cream px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Unread
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.unreadBooks}
              </div>
            </div>
            <div className="rounded-xl border border-warm-gray bg-cream px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Read by Dane
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.readByDane}
              </div>
            </div>
            <div className="rounded-xl border border-warm-gray bg-cream px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Read by Emma
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.readByEmma}
              </div>
            </div>
            <div className="rounded-xl border border-warm-gray bg-cream px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Read by Both
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.readByBoth}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

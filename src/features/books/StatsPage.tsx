import { useEffect, useMemo, useState } from "react";
import { getAllBooks } from "../../data/bookRepo";
import { PageHero, PageLayout, PageSection } from "../../ui/components/PageLayout";
import type { Book } from "./bookTypes";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-warm-gray bg-cream px-4 py-3 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-stone-900">{value}</div>
    </div>
  );
}

export function StatsPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        setBooks(await getAllBooks());
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load library stats.");
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
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
    <PageLayout>
      <PageHero
        title="Library Statistics"
        description="Overview of your collection and reading progress."
      />

      <PageSection>
        {loading ? (
          <div
            className="rounded-xl border border-warm-gray bg-cream px-4 py-6 text-center text-sm text-stone-500"
            aria-live="polite"
          >
            Loading stats...
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
            <StatCard label="Total Books" value={stats.totalBooks} />
            <StatCard label="Finished" value={stats.finishedBooks} />
            <StatCard label="Unread" value={stats.unreadBooks} />
            <StatCard label="Read by Dane" value={stats.readByDane} />
            <StatCard label="Read by Emma" value={stats.readByEmma} />
            <StatCard label="Read by Both" value={stats.readByBoth} />
          </div>
        )}
      </PageSection>
    </PageLayout>
  );
}

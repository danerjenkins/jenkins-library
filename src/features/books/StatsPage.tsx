import { useEffect, useState } from "react";
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

  const totalBooks = books.length;
  const finishedBooks = books.filter((book) => book.finished).length;
  const readByDane = books.filter((book) => book.readByDane).length;
  const readByEmma = books.filter((book) => book.readByEmma).length;
  const readByBoth = books.filter(
    (book) => book.readByDane && book.readByEmma,
  ).length;
  const unreadBooks = books.filter(
    (book) => !book.readByDane && !book.readByEmma,
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft sm:p-6">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900">
            Library Statistics
          </h2>
          <p className="font-sans mt-2 text-sm leading-relaxed text-stone-600">
            Overview of your collection and reading progress.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-soft sm:p-6">
        {loading ? (
          <div className="text-sm text-stone-500">Loading stats...</div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : (
          <div className="grid gap-4 text-sm text-stone-700 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Total Books
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {totalBooks}
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Finished
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {finishedBooks}
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Unread
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {unreadBooks}
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Read by Dane
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {readByDane}
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Read by Emma
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {readByEmma}
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Read by Both
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {readByBoth}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

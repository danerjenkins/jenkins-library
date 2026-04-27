import { useEffect, useMemo, useState } from "react";
import { getAllBooks, getWishlistBooks } from "../../data/bookRepo";
import { PageHero, PageLayout, PageSection } from "../../ui/components/PageLayout";
import { LoadingState } from "../../ui/components/LoadingState";
import { BOOK_FORMAT_LABELS, type Book } from "./bookTypes";
import {
  buildRankedStats,
  calculateMedian,
  formatNumber,
  formatPages,
  formatPercent,
  InsightCard,
  RankedList,
  StatCard,
  type RankedStat,
} from "./StatsPageSections";

type LibraryStats = {
  totalBooks: number;
  ownedBooks: number;
  wishlistBooks: number;
  finishedBooks: number;
  unreadBooks: number;
  readByDane: number;
  readByEmma: number;
  readByBoth: number;
  booksWithPages: number;
  totalPages: number;
  averagePages: number;
  medianPages: number;
  longestBook: Book | null;
  booksWithYear: number;
  earliestYear: number | null;
  latestYear: number | null;
  booksInSeries: number;
  seriesCount: number;
  topGenres: RankedStat[];
  topAuthors: RankedStat[];
  topFormats: RankedStat[];
};

export function StatsPage() {
  const [ownedBooks, setOwnedBooks] = useState<Book[]>([]);
  const [wishlistBooks, setWishlistBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const [owned, wishlist] = await Promise.all([getAllBooks(), getWishlistBooks()]);
        setOwnedBooks(owned);
        setWishlistBooks(wishlist);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load library stats.");
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, []);

  const books = useMemo(() => [...ownedBooks, ...wishlistBooks], [ownedBooks, wishlistBooks]);

  const stats = useMemo<LibraryStats>(
    () => {
      const pages = books
        .map((book) => book.pages)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
      const years = books
        .map((book) => book.publishedYear)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

      let longestBook: Book | null = null;
      let longestPages = 0;

      for (const book of books) {
        if (typeof book.pages === "number" && book.pages > longestPages) {
          longestPages = book.pages;
          longestBook = book;
        }
      }

      const totalPages = pages.reduce((sum, value) => sum + value, 0);

      const seriesCount = new Set(
        books.map((book) => book.seriesName?.trim()).filter((value): value is string => Boolean(value)),
      ).size;

      return {
        totalBooks: books.length,
        ownedBooks: ownedBooks.length,
        wishlistBooks: wishlistBooks.length,
        finishedBooks: books.filter((book) => book.finished).length,
        unreadBooks: books.filter((book) => !book.readByDane && !book.readByEmma).length,
        readByDane: books.filter((book) => book.readByDane).length,
        readByEmma: books.filter((book) => book.readByEmma).length,
        readByBoth: books.filter((book) => book.readByDane && book.readByEmma).length,
        booksWithPages: pages.length,
        totalPages,
        averagePages: pages.length > 0 ? totalPages / pages.length : 0,
        medianPages: calculateMedian(pages),
        longestBook,
        booksWithYear: years.length,
        earliestYear: years.length > 0 ? Math.min(...years) : null,
        latestYear: years.length > 0 ? Math.max(...years) : null,
        booksInSeries: books.filter((book) => Boolean(book.seriesName?.trim())).length,
        seriesCount,
        topGenres: buildRankedStats(
          books.map((book) => book.genre),
          books.length,
        ),
        topAuthors: buildRankedStats(
          books.map((book) => book.author),
          books.length,
        ),
        topFormats: buildRankedStats(
          books.map((book) => (book.format ? BOOK_FORMAT_LABELS[book.format] : null)),
          books.length,
        ),
      };
    },
    [books, ownedBooks.length, wishlistBooks.length],
  );

  const spanLabel =
    stats.earliestYear && stats.latestYear
      ? `${stats.earliestYear} to ${stats.latestYear}`
      : "No publication years yet";

  const heroMeta =
    stats.totalBooks > 0 ? (
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="ds-chip border-warm-gray bg-cream px-3 py-1 text-stone-700">
          {formatNumber(stats.ownedBooks)} owned
        </span>
        <span className="ds-chip border-warm-gray bg-cream px-3 py-1 text-stone-700">
          {formatNumber(stats.wishlistBooks)} on wishlist
        </span>
        <span className="ds-chip border-warm-gray bg-cream px-3 py-1 text-stone-700">
          {formatNumber(stats.seriesCount)} series
        </span>
        <span className="ds-chip border-warm-gray bg-cream px-3 py-1 text-stone-700">
          {formatNumber(stats.booksWithPages)} with page counts
        </span>
      </div>
    ) : null;

  return (
    <PageLayout>
      <PageHero
        title="Library Statistics"
        description="A wider look at the collection: ownership mix, reading progress, genre and author concentration, page counts, publication years, and series coverage."
        meta={heroMeta}
      />

      <PageSection>
        {loading ? (
          <LoadingState
            title="Loading Stats"
            description="Pulling together the collection, wishlist, and reading patterns."
            variant="panel"
          />
        ) : errorMessage ? (
          <div
            className="ds-panel-surface border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : stats.totalBooks === 0 ? (
          <div className="ds-panel-surface border-dashed border-warm-gray bg-parchment/75 px-4 py-10 text-center text-sm text-stone-600">
            <p className="font-medium">No stats yet</p>
            <p className="ds-muted-meta mt-1 text-xs">
              Add books to see ownership, reading, and collection patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Books" value={formatNumber(stats.totalBooks)} />
              <StatCard
                label="Owned / Wishlist"
                value={`${formatNumber(stats.ownedBooks)} / ${formatNumber(stats.wishlistBooks)}`}
                detail="Books currently in the library versus on the wish list."
              />
              <StatCard
                label="Finished"
                value={formatNumber(stats.finishedBooks)}
                detail={`${formatPercent((stats.finishedBooks / stats.totalBooks) * 100)} of the catalog`}
              />
              <StatCard
                label="Unread"
                value={formatNumber(stats.unreadBooks)}
                detail={`${formatPercent((stats.unreadBooks / stats.totalBooks) * 100)} still waiting`}
              />
              <StatCard label="Read by Dane" value={formatNumber(stats.readByDane)} />
              <StatCard label="Read by Emma" value={formatNumber(stats.readByEmma)} />
              <StatCard label="Read by Both" value={formatNumber(stats.readByBoth)} />
              <StatCard
                label="Page Count"
                value={formatPages(stats.averagePages)}
                detail={`${formatNumber(stats.booksWithPages)} books with pages · ${formatNumber(stats.totalPages)} pages total`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <InsightCard
                label="Shelf Shape"
                title={
                  stats.topGenres[0]
                    ? `${stats.topGenres[0].label} leads the shelf`
                    : "Genre mix is still sparse"
                }
                detail={
                  stats.topGenres[0]
                    ? `${formatNumber(stats.topGenres[0].count)} books, or ${formatPercent(
                        stats.topGenres[0].share,
                      )} of the catalog, sit in ${stats.topGenres[0].label}.`
                    : "Add genre tags to reveal the strongest patterns in the collection."
                }
              />
              <InsightCard
                label="Reading Span"
                title={spanLabel}
                detail={
                  stats.booksWithYear > 0
                    ? `${formatNumber(stats.booksWithYear)} books include publication years, making it easy to compare the oldest and newest entries.`
                    : "Publication years are not populated yet."
                }
              />
              <InsightCard
                label="Page Load"
                title={
                  stats.longestBook && typeof stats.longestBook.pages === "number"
                    ? `${stats.longestBook.title} is the largest book`
                    : "No page counts yet"
                }
                detail={
                  stats.longestBook && typeof stats.longestBook.pages === "number"
                    ? `${formatNumber(stats.longestBook.pages)} pages, against a median of ${formatPages(
                        stats.medianPages,
                      )}.`
                    : "Populate page counts to surface the longest and shortest books."
                }
              />
              <InsightCard
                label="Series Coverage"
                title={`${formatNumber(stats.booksInSeries)} books in ${formatNumber(stats.seriesCount)} series`}
                detail={
                  stats.seriesCount > 0
                    ? "Series data is rich enough to surface recurring arcs and multi-book reads."
                    : "Series data is not populated yet."
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <RankedList
                title="Top Genres"
                items={stats.topGenres}
                emptyText="No genre data yet."
              />
              <RankedList
                title="Top Authors"
                items={stats.topAuthors}
                emptyText="No author data yet."
              />
              <RankedList
                title="Top Formats"
                items={stats.topFormats}
                emptyText="No format data yet."
              />
            </div>
          </div>
        )}
      </PageSection>
    </PageLayout>
  );
}

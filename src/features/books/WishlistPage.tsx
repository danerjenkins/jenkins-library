import { useCallback, useEffect, useMemo, useState } from "react";
import { getWishlistBooks, updateBook } from "../../data/bookRepo";
import type { Book } from "./bookTypes";
import { BookCard, BookGrid, BookShelfState } from "./components/BookCard";

function sortWishlistBooks(books: Book[]) {
  return [...books].sort((a, b) => {
    const genreCompare = (a.genre ?? "").localeCompare(
      b.genre ?? "",
      undefined,
      { sensitivity: "base" },
    );
    if (genreCompare !== 0) return genreCompare;

    const authorCompare = a.author.localeCompare(b.author, undefined, {
      sensitivity: "base",
    });
    if (authorCompare !== 0) return authorCompare;

    const seriesCompare = (a.seriesName ?? "").localeCompare(
      b.seriesName ?? "",
      undefined,
      { sensitivity: "base" },
    );
    if (seriesCompare !== 0) return seriesCompare;

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

export function WishlistPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const wishlistBooks = await getWishlistBooks();
      setBooks(
        wishlistBooks.filter(
          (book) => (book.ownershipStatus ?? "owned") === "wishlist",
        ),
      );
    } catch (error) {
      console.error("Failed to load wishlist books:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  const sortedBooks = useMemo(() => sortWishlistBooks(books), [books]);

  const handleReadStatusChange = useCallback(
    async (bookId: string, readByDane: boolean, readByEmma: boolean) => {
      const previousState = books.find((book) => book.id === bookId);

      try {
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.id === bookId ? { ...book, readByDane, readByEmma } : book,
          ),
        );

        await updateBook(bookId, { readByDane, readByEmma });
      } catch (error) {
        console.error("Failed to update book:", error);
        if (previousState) {
          setBooks((prevBooks) =>
            prevBooks.map((book) =>
              book.id === bookId
                ? {
                    ...book,
                    readByDane: previousState.readByDane,
                    readByEmma: previousState.readByEmma,
                  }
                : book,
            ),
          );
        }
      }
    },
    [books],
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="rounded-lg border border-warm-gray bg-cream/95 p-5 shadow-soft backdrop-blur-sm sm:p-7">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold tracking-tight text-pretty text-stone-900 sm:text-4xl">
              Wishlist
            </h2>
            <p className="font-sans max-w-3xl text-base leading-relaxed text-stone-600">
              Books you want to own, ordered by genre, author, and series.
            </p>
          </div>
          <div className="mt-6 text-sm text-stone-600" aria-live="polite">
            {sortedBooks.length} {sortedBooks.length === 1 ? "book" : "books"}
          </div>
        </section>

        <section className="space-y-6">
          {loading ? (
            <BookShelfState title="Loading Wishlist…" />
          ) : sortedBooks.length === 0 ? (
            <BookShelfState
              title="No Wishlist Books Yet"
              description="Add books as wishlist items from the Admin page."
            />
          ) : (
            <BookGrid cardSize="medium">
              {sortedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant="view"
                  cardSize="medium"
                  clickable={true}
                  onReadStatusChange={handleReadStatusChange}
                />
              ))}
            </BookGrid>
          )}
        </section>
      </div>
    </div>
  );
}

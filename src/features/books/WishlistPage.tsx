import { useEffect, useMemo, useState } from "react";
import { getWishlistBooks, updateBook } from "../../data/bookRepo";
import type { Book } from "./bookTypes";
import { BookCard } from "./components/BookCard";

export function WishlistPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadBooks();
  }, []);

  async function loadBooks() {
    try {
      setLoading(true);
      const wishlistBooks = await getWishlistBooks();
      setBooks(
        wishlistBooks.filter((book) => (book.ownershipStatus ?? "owned") === "wishlist"),
      );
    } catch (error) {
      console.error("Failed to load wishlist books:", error);
    } finally {
      setLoading(false);
    }
  }

  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      const genreCompare = (a.genre ?? "").localeCompare(b.genre ?? "", undefined, {
        sensitivity: "base",
      });
      if (genreCompare !== 0) return genreCompare;

      const authorCompare = (a.author ?? "").localeCompare(b.author ?? "", undefined, {
        sensitivity: "base",
      });
      if (authorCompare !== 0) return authorCompare;

      const seriesCompare = (a.seriesName ?? "").localeCompare(b.seriesName ?? "", undefined, {
        sensitivity: "base",
      });
      if (seriesCompare !== 0) return seriesCompare;

      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });
  }, [books]);

  const handleReadStatusChange = async (
    bookId: string,
    readByDane: boolean,
    readByEmma: boolean,
  ) => {
    let previousState: { readByDane: boolean; readByEmma: boolean } | null =
      null;

    try {
      setBooks((prevBooks) =>
        prevBooks.map((book) =>
          book.id === bookId
            ? (() => {
                previousState = {
                  readByDane: book.readByDane,
                  readByEmma: book.readByEmma,
                };
                return { ...book, readByDane, readByEmma };
              })()
            : book,
        ),
      );

      await updateBook(bookId, { readByDane, readByEmma });
    } catch (error) {
      console.error("Failed to update book:", error);
      if (previousState) {
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.id === bookId ? { ...book, ...previousState } : book,
          ),
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-stone-50 to-amber-50/30">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-3xl bg-white/95 p-6 shadow-soft backdrop-blur-sm sm:p-8">
          <div className="space-y-2">
            <h2 className="font-display text-4xl font-bold tracking-tight text-stone-900">
              Wishlist
            </h2>
            <p className="font-sans text-base leading-relaxed text-stone-600">
              Books you want to own, ordered by genre, author, and series.
            </p>
          </div>
          <div className="mt-6 text-sm text-stone-600">
            {sortedBooks.length} {sortedBooks.length === 1 ? "book" : "books"}
          </div>
        </section>

        <section className="space-y-6">
          {loading ? (
            <div className="rounded-2xl border border-stone-200/40 bg-white/60 px-6 py-12 text-center text-sm text-stone-500 shadow-sm">
              Loading wishlist...
            </div>
          ) : sortedBooks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300/60 bg-stone-50 px-6 py-14 text-center text-sm text-stone-600">
              <p className="font-medium">No wishlist books yet</p>
              <p className="mt-1 text-xs text-stone-500">
                Add books as wishlist items from the Admin page.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { getAllBooks, getWishlistBooks } from "../../../data/bookRepo";
import type { Book } from "../lib/bookTypes";

function mergeBooks(ownedBooks: Book[], wishlistBooks: Book[]) {
  const bookMap = new Map<string, Book>();

  for (const book of [...ownedBooks, ...wishlistBooks]) {
    bookMap.set(book.id, book);
  }

  return Array.from(bookMap.values());
}

export function useMergedShelfBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const [ownedBooks, wishlistBooks] = await Promise.all([getAllBooks(), getWishlistBooks()]);
      setBooks(mergeBooks(ownedBooks, wishlistBooks));
    } catch (error) {
      console.error("Failed to load books:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  return { books, setBooks, loading, reloadBooks: loadBooks };
}

export function useWishlistShelfBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  return { books, setBooks, loading, reloadBooks: loadBooks };
}

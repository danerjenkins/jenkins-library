import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllBooks, getWishlistBooks } from "../../../data/bookRepo";
import type { Book } from "../lib/bookTypes";
import {
  getReadingListPreferences,
  setReadingListPreferences,
  type ReaderId,
} from "../lib/readingListPreferences";
import {
  addBookToReadingList,
  getReadingListQueues,
  moveBookInReadingList,
  removeBookFromReadingList,
  resetReadingList,
} from "../../../repos/readingListRepo";

function sortBooks(books: Book[]) {
  return [...books].sort((a, b) => {
    const genreCompare = (a.genre ?? "").localeCompare(b.genre ?? "", undefined, {
      sensitivity: "base",
    });
    if (genreCompare !== 0) return genreCompare;

    const authorCompare = a.author.localeCompare(b.author, undefined, {
      sensitivity: "base",
    });
    if (authorCompare !== 0) return authorCompare;

    const seriesCompare = (a.seriesName ?? "").localeCompare(b.seriesName ?? "", undefined, {
      sensitivity: "base",
    });
    if (seriesCompare !== 0) return seriesCompare;

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

export function useReadingListPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeReader, setActiveReaderState] = useState<ReaderId>(
    () => getReadingListPreferences().activeReader,
  );
  const [queueIdsByReader, setQueueIdsByReader] = useState<Record<ReaderId, string[]>>({
    dane: [],
    emma: [],
  });

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const [ownedBooks, wishlistBooks, readingListQueues] = await Promise.all([
          getAllBooks(),
          getWishlistBooks(),
          getReadingListQueues(),
        ]);

        if (ignore) {
          return;
        }

        const merged = new Map<string, Book>();
        [...ownedBooks, ...wishlistBooks].forEach((book) => merged.set(book.id, book));
        setBooks(Array.from(merged.values()));
        setQueueIdsByReader(readingListQueues);
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load reading list books:", error);
          setErrorMessage("Reading list could not be loaded right now.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const booksById = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);

  const queueBooks = useMemo(
    () =>
      queueIdsByReader[activeReader]
        .map((id) => booksById.get(id))
        .filter((book): book is Book => book !== undefined),
    [activeReader, booksById, queueIdsByReader],
  );

  const queueIds = useMemo(() => new Set(queueBooks.map((book) => book.id)), [queueBooks]);

  const booksByOwnership = useMemo(() => {
    const owned = sortBooks(books.filter((book) => (book.ownershipStatus ?? "owned") === "owned"));
    const wishlist = sortBooks(books.filter((book) => book.ownershipStatus === "wishlist"));

    return {
      owned,
      wishlist,
    };
  }, [books]);

  const prioritizedBooks = useMemo(() => {
    const remainingOwned = booksByOwnership.owned.filter((book) => !queueIds.has(book.id));
    const remainingWishlist = booksByOwnership.wishlist.filter((book) => !queueIds.has(book.id));

    return {
      queueBooks,
      remainingOwned,
      remainingWishlist,
      queuedCount: queueBooks.length,
      ownedCount: booksByOwnership.owned.length,
      wishlistCount: booksByOwnership.wishlist.length,
    };
  }, [booksByOwnership.owned, booksByOwnership.wishlist, queueBooks, queueIds]);

  const setActiveReader = useCallback((readerId: ReaderId) => {
    setActiveReaderState(readerId);
    setReadingListPreferences({ activeReader: readerId });
  }, []);

  const addToQueue = useCallback(
    async (readerId: ReaderId, bookId: string) => {
      const nextQueueIds = await addBookToReadingList(readerId, bookId);
      setQueueIdsByReader((current) => ({
        ...current,
        [readerId]: nextQueueIds,
      }));
    },
    [],
  );

  const moveBook = useCallback(
    async (readerId: ReaderId, bookId: string, direction: "up" | "down") => {
      const nextQueueIds = await moveBookInReadingList(readerId, bookId, direction);
      setQueueIdsByReader((current) => ({
        ...current,
        [readerId]: nextQueueIds,
      }));
    },
    [],
  );

  const removeFromQueue = useCallback(
    async (readerId: ReaderId, bookId: string) => {
      const nextQueueIds = await removeBookFromReadingList(readerId, bookId);
      setQueueIdsByReader((current) => ({
        ...current,
        [readerId]: nextQueueIds,
      }));
    },
    [],
  );

  const resetReaderQueues = useCallback(
    async (readerId: ReaderId) => {
      const nextQueueIds = await resetReadingList(readerId);
      setQueueIdsByReader((current) => ({
        ...current,
        [readerId]: nextQueueIds,
      }));
    },
    [],
  );

  return {
    state: { activeReader },
    loading,
    errorMessage,
    booksByOwnership,
    prioritizedBooks,
    actions: {
      setActiveReader,
      addToQueue,
      moveBook,
      removeFromQueue,
      resetReaderQueues,
    },
  };
}

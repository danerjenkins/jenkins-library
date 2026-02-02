import { db } from "./db";
import { getAllBooks } from "./bookRepo";
import type { Book } from "../features/books/bookTypes";

export interface SyncPayload {
  schemaVersion: number;
  exportedAt: number;
  books: Book[];
}

/**
 * Export all books to a sync-compatible JSON payload
 */
export async function exportBooks(): Promise<SyncPayload> {
  const books = await getAllBooks();
  return {
    schemaVersion: 1,
    exportedAt: Date.now(),
    books,
  };
}

/**
 * Import books from a sync payload
 * Replaces all local books with the imported ones
 */
export async function importBooks(payload: SyncPayload): Promise<void> {
  // Validate schema version
  if (payload.schemaVersion !== 1) {
    throw new Error(
      `Unsupported schema version: ${payload.schemaVersion}. Expected version 1.`,
    );
  }

  // Validate payload structure
  if (!Array.isArray(payload.books)) {
    throw new Error("Invalid payload: books must be an array");
  }

  // Clear existing books and insert new ones, applying defaults for missing fields
  await db.transaction("rw", db.books, async () => {
    await db.books.clear();
    const booksWithDefaults = payload.books.map((book) => ({
      ...book,
      genre: book.genre ?? null,
      isbn: book.isbn ?? null,
      finished: book.finished ?? false,
      coverUrl: book.coverUrl ?? null,
    }));
    await db.books.bulkAdd(booksWithDefaults);
  });
}

/**
 * Get the timestamp of the most recently updated book
 */
export async function getLatestLocalTimestamp(): Promise<number> {
  const books = await getAllBooks();
  if (books.length === 0) {
    return 0;
  }
  return Math.max(...books.map((book) => book.updatedAt));
}

/**
 * Validate a sync payload structure
 */
export function validatePayload(data: unknown): data is SyncPayload {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const payload = data as Partial<SyncPayload>;

  return (
    typeof payload.schemaVersion === "number" &&
    typeof payload.exportedAt === "number" &&
    Array.isArray(payload.books) &&
    payload.books.every(
      (book) =>
        typeof book === "object" &&
        book !== null &&
        typeof book.id === "string" &&
        typeof book.title === "string" &&
        typeof book.author === "string" &&
        typeof book.createdAt === "number" &&
        typeof book.updatedAt === "number" &&
        // genre and finished are optional for backward compatibility
        (book.genre === undefined ||
          book.genre === null ||
          typeof book.genre === "string") &&
        (book.isbn === undefined ||
          book.isbn === null ||
          typeof book.isbn === "string") &&
        (book.finished === undefined || typeof book.finished === "boolean"),
    )
  );
}

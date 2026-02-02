import { db } from "./db";
import type { Book } from "../features/books/bookTypes";

/**
 * Generate a unique ID for a book
 */
function generateId(): string {
  return `book_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all books from the database, sorted by title
 */
export async function getAllBooks(): Promise<Book[]> {
  const books = await db.books.orderBy("title").toArray();
  // Apply defaults for books missing new fields
  return books.map((book) => ({
    ...book,
    genre: book.genre ?? null,
    isbn: book.isbn ?? null,
    finished: book.finished ?? false,
    coverUrl: book.coverUrl ?? null,
  }));
}

/**
 * Get a single book by ID
 */
export async function getBookById(id: string): Promise<Book | undefined> {
  return await db.books.get(id);
}

/**
 * Add a new book to the database
 */
export async function addBook(input: {
  title: string;
  author: string;
  genre?: string | null;
  isbn?: string | null;
  finished?: boolean;
  coverUrl?: string | null;
}): Promise<Book> {
  const now = Date.now();
  const book: Book = {
    id: generateId(),
    title: input.title,
    author: input.author,
    genre: input.genre ?? null,
    isbn: input.isbn ?? null,
    finished: input.finished ?? false,
    coverUrl: input.coverUrl ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.books.add(book);
  return book;
}

/**
 * Update an existing book
 */
export async function updateBook(
  id: string,
  patch: Partial<Omit<Book, "id" | "createdAt">>,
): Promise<Book> {
  const existing = await db.books.get(id);
  if (!existing) {
    throw new Error(`Book with id ${id} not found`);
  }

  const updated: Book = {
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  };

  await db.books.put(updated);
  return updated;
}

/**
 * Delete a book by ID
 */
export async function deleteBook(id: string): Promise<void> {
  await db.books.delete(id);
}

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
  return await db.books.orderBy("title").toArray();
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
}): Promise<Book> {
  const now = Date.now();
  const book: Book = {
    id: generateId(),
    title: input.title,
    author: input.author,
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

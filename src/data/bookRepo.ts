import { db } from "./db";
import type { Book } from "../features/books/bookTypes";
import {
  createBook as createSupabaseBook,
  deleteBook as deleteSupabaseBook,
  getBook as getSupabaseBook,
  listBooks as listSupabaseBooks,
  updateBook as updateSupabaseBook,
  type BookInput as SupabaseBookInput,
} from "../repos/supabaseBookRepo";

const DELETED_IDS_STORAGE_KEY = "sync:deletedBookIds";
const useSupabase = import.meta.env.VITE_DATA_SOURCE === "supabase";

type LocalBookInput = {
  title: string;
  author: string;
  genre?: string | null;
  description?: string | null;
  isbn?: string | null;
  finished?: boolean;
  coverUrl?: string | null;
  readByDane?: boolean;
  readByEmma?: boolean;
  format?: string;
  pages?: number;
};

function toSupabaseInput(input: LocalBookInput): SupabaseBookInput {
  return {
    title: input.title,
    author: input.author,
    genre: input.genre ?? null,
    description: input.description ?? null,
    isbn: input.isbn ?? null,
    coverUrl: input.coverUrl ?? null,
    readByDane: input.readByDane ?? false,
    readByEmma: input.readByEmma ?? false,
  };
}

function toSupabasePatch(
  patch: Partial<Omit<Book, "id" | "createdAt">>,
): Partial<SupabaseBookInput> {
  const result: Partial<SupabaseBookInput> = {};

  if (patch.title !== undefined) result.title = patch.title;
  if (patch.author !== undefined) result.author = patch.author;
  if (patch.genre !== undefined) result.genre = patch.genre ?? null;
  if (patch.description !== undefined)
    result.description = patch.description ?? null;
  if (patch.isbn !== undefined) result.isbn = patch.isbn ?? null;
  if (patch.coverUrl !== undefined) result.coverUrl = patch.coverUrl ?? null;
  if (patch.readByDane !== undefined) result.readByDane = patch.readByDane;
  if (patch.readByEmma !== undefined) result.readByEmma = patch.readByEmma;

  return result;
}

/**
 * Generate a unique ID for a book
 */
function generateId(): string {
  return `book_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get the list of deleted book IDs since last sync
 */
export function getDeletedBookIds(): string[] {
  const stored = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Add a book ID to the deletion tracking list
 */
function addDeletedBookId(id: string): void {
  const deleted = getDeletedBookIds();
  if (!deleted.includes(id)) {
    deleted.push(id);
    localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify(deleted));
  }
}

/**
 * Clear the deletion tracking list (call after successful sync)
 */
export function clearDeletedBookIds(): void {
  localStorage.removeItem(DELETED_IDS_STORAGE_KEY);
}

/**
 * Get all books from the database, sorted by title
 */
async function getAllBooksLocal(): Promise<Book[]> {
  const books = await db.books.orderBy("title").toArray();
  // Apply defaults for books missing new fields
  return books.map((book) => ({
    ...book,
    genre: book.genre ?? null,
    description: book.description ?? null,
    isbn: book.isbn ?? null,
    finished: book.finished ?? false,
    coverUrl: book.coverUrl ?? null,
    readByDane: book.readByDane ?? false,
    readByEmma: book.readByEmma ?? false,
    format: book.format,
    pages: book.pages,
  }));
}

/**
 * Get a single book by ID
 */
async function getBookByIdLocal(id: string): Promise<Book | undefined> {
  return await db.books.get(id);
}

/**
 * Add a new book to the database
 */
async function addBookLocal(input: LocalBookInput): Promise<Book> {
  const now = Date.now();
  const book: Book = {
    id: generateId(),
    title: input.title,
    author: input.author,
    genre: input.genre ?? null,
    description: input.description ?? null,
    isbn: input.isbn ?? null,
    finished: input.finished ?? false,
    coverUrl: input.coverUrl ?? null,
    readByDane: input.readByDane ?? false,
    readByEmma: input.readByEmma ?? false,
    format: input.format as any,
    pages: input.pages,
    createdAt: now,
    updatedAt: now,
  };

  await db.books.add(book);
  return book;
}

/**
 * Update an existing book
 */
async function updateBookLocal(
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
async function deleteBookLocal(id: string): Promise<void> {
  await db.books.delete(id);
  // Track this deletion for sync purposes
  addDeletedBookId(id);
}

export async function getAllBooks(): Promise<Book[]> {
  if (useSupabase) {
    return await listSupabaseBooks();
  }
  return await getAllBooksLocal();
}

export async function getBookById(id: string): Promise<Book | undefined> {
  if (useSupabase) {
    const book = await getSupabaseBook(id);
    return book ?? undefined;
  }
  return await getBookByIdLocal(id);
}

export async function addBook(input: LocalBookInput): Promise<Book> {
  if (useSupabase) {
    return await createSupabaseBook(toSupabaseInput(input));
  }
  return await addBookLocal(input);
}

export async function updateBook(
  id: string,
  patch: Partial<Omit<Book, "id" | "createdAt">>,
): Promise<Book> {
  if (useSupabase) {
    return await updateSupabaseBook(id, toSupabasePatch(patch));
  }
  return await updateBookLocal(id, patch);
}

export async function deleteBook(id: string): Promise<void> {
  if (useSupabase) {
    await deleteSupabaseBook(id);
    return;
  }
  await deleteBookLocal(id);
}

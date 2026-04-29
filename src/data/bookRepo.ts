import type { Book } from "../features/books/lib/bookTypes";
import { getSupabaseClientWithSchema } from "../lib/supabaseSchema";
import {
  createBook as createSupabaseBook,
  deleteBook as deleteSupabaseBook,
  getBook as getSupabaseBook,
  listBooks as listSupabaseBooks,
  listWishlistBooks,
  updateBook as updateSupabaseBook,
  type BookInput as SupabaseBookInput,
} from "../repos/supabaseBookRepo";

const DELETED_IDS_STORAGE_KEY = "sync:deletedBookIds";
const supabaseClient = getSupabaseClientWithSchema();

type BookInput = {
  title: string;
  author: string;
  genre?: string | null;
  description?: string | null;
  isbn?: string | null;
  finished?: boolean;
  coverUrl?: string | null;
  publishedYear?: number | null;
  readByDane?: boolean;
  readByEmma?: boolean;
  format?: string;
  pages?: number;
  ownershipStatus?: "owned" | "wishlist";
};

export type BookSeriesInput = {
  seriesId: string;
  seriesLabel?: string | null;
  seriesSort?: number | null;
};

function toSupabaseInput(input: BookInput): SupabaseBookInput {
  return {
    title: input.title,
    author: input.author,
    genre: input.genre ?? null,
    description: input.description ?? null,
    isbn: input.isbn ?? null,
    coverUrl: input.coverUrl ?? null,
    publishedYear: input.publishedYear ?? null,
    finished: input.finished ?? false,
    readByDane: input.readByDane ?? false,
    readByEmma: input.readByEmma ?? false,
    format: input.format as SupabaseBookInput["format"],
    pages: input.pages,
    ownershipStatus: input.ownershipStatus,
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
  if (patch.publishedYear !== undefined)
    result.publishedYear = patch.publishedYear ?? null;
  if (patch.finished !== undefined) result.finished = patch.finished;
  if (patch.readByDane !== undefined) result.readByDane = patch.readByDane;
  if (patch.readByEmma !== undefined) result.readByEmma = patch.readByEmma;
  if (patch.format !== undefined) result.format = patch.format as SupabaseBookInput["format"];
  if (patch.pages !== undefined) result.pages = patch.pages;
  if (patch.ownershipStatus !== undefined)
    result.ownershipStatus = patch.ownershipStatus;

  return result;
}

/**
 * Get the list of deleted book IDs since last sync
 */
export function getDeletedBookIds(): string[] {
  const stored = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear the deletion tracking list (call after successful sync)
 */
export function clearDeletedBookIds(): void {
  localStorage.removeItem(DELETED_IDS_STORAGE_KEY);
}

export async function getAllBooks(): Promise<Book[]> {
  return await listSupabaseBooks();
}

export async function getWishlistBooks(): Promise<Book[]> {
  return await listWishlistBooks();
}

export async function getBookById(id: string): Promise<Book | undefined> {
  const book = await getSupabaseBook(id);
  return book ?? undefined;
}

export async function addBook(input: BookInput): Promise<Book> {
  return await createSupabaseBook(toSupabaseInput(input));
}

export async function updateBook(
  id: string,
  patch: Partial<Omit<Book, "id" | "createdAt">>,
): Promise<Book> {
  return await updateSupabaseBook(id, toSupabasePatch(patch));
}

export async function deleteBook(id: string): Promise<void> {
  await deleteSupabaseBook(id);
}

export async function setBookSeries(
  bookId: string,
  input: BookSeriesInput,
): Promise<void> {
  const { error } = await supabaseClient
    .from("book_series")
    .upsert(
      {
        book_id: bookId,
        series_id: input.seriesId,
        series_label: input.seriesLabel ?? null,
        series_sort: input.seriesSort ?? null,
      },
      { onConflict: "book_id" },
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearBookSeries(bookId: string): Promise<void> {
  const { error } = await supabaseClient
    .from("book_series")
    .delete()
    .eq("book_id", bookId);

  if (error) {
    throw new Error(error.message);
  }
}

export function sortBooksBySeriesOrder(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const sortA = a.seriesSort ?? Number.POSITIVE_INFINITY;
    const sortB = b.seriesSort ?? Number.POSITIVE_INFINITY;
    if (sortA !== sortB) return sortA - sortB;
    return a.title.localeCompare(b.title);
  });
}

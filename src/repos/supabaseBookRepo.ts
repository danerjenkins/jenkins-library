import { getSupabaseClientWithSchema } from "../lib/supabaseSchema";
import * as BookTypes from "../features/books/bookTypes";
import type { Book, BookFormat } from "../features/books/bookTypes";

export type BookInput = {
  title: string;
  author: string;
  genre?: string | null;
  description?: string | null;
  isbn?: string | null;
  coverUrl?: string | null;
  publishedYear?: number | null;
  finished?: boolean;
  readByDane?: boolean;
  readByEmma?: boolean;
  format?: BookFormat;
  pages?: number;
  ownershipStatus?: "owned" | "wishlist";
};

type BookRow = {
  id: string;
  title: string | null;
  author: string | null;
  genre: string | null;
  description: string | null;
  isbn: string | null;
  published_year: number | null;
  cover_url: string | null;
  cover_drive_file_id: string | null;
  finished: boolean | null;
  format: string | null;
  pages: number | null;
  read_by_dane: boolean | null;
  read_by_emma: boolean | null;
  ownership_status: "owned" | "wishlist" | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

type BookWithSeriesRow = BookRow & {
  series_id: string | null;
  series_name: string | null;
  series_label: string | null;
  series_sort: number | null;
};

const supabaseClient = getSupabaseClientWithSchema();

function toTimestamp(value: string | null): number {
  if (!value) {
    return Date.now();
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeFormat(value: string | null): BookFormat | undefined {
  if (!value) {
    return undefined;
  }

  return value in BookTypes.BOOK_FORMAT_LABELS ? (value as BookFormat) : undefined;
}

function mapRowToBook(row: BookWithSeriesRow): Book {
  const createdAt = toTimestamp(row.created_at);
  const updatedAt = row.updated_at ? toTimestamp(row.updated_at) : createdAt;

  return {
    id: row.id,
    title: row.title ?? "",
    author: row.author ?? "",
    genre: row.genre ?? null,
    description: row.description ?? null,
    isbn: row.isbn ?? null,
    finished: row.finished ?? false,
    coverUrl: row.cover_url ?? null,
    readByDane: row.read_by_dane ?? false,
    readByEmma: row.read_by_emma ?? false,
    format: normalizeFormat(row.format),
    pages: row.pages ?? undefined,
    publishedYear: row.published_year ?? null,
    seriesId: row.series_id ?? null,
    seriesName: row.series_name ?? null,
    seriesLabel: row.series_label ?? null,
    seriesSort: row.series_sort ?? null,
    ownershipStatus: row.ownership_status ?? undefined,
    createdAt,
    updatedAt,
  };
}

export async function listBooks(): Promise<Book[]> {
  const { data, error } = await supabaseClient
    .from("books_with_series")
    .select("*")
    .is("deleted_at", null)
    .eq("ownership_status", "owned")
    .order("genre", { ascending: true, nullsFirst: false })
    .order("author", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRowToBook(row as BookWithSeriesRow));
}

export async function listWishlistBooks(): Promise<Book[]> {
  const { data, error } = await supabaseClient
    .from("books_with_series")
    .select("*")
    .is("deleted_at", null)
    .eq("ownership_status", "wishlist")
    .order("genre", { ascending: true, nullsFirst: false })
    .order("author", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRowToBook(row as BookWithSeriesRow));
}

export async function getBook(id: string): Promise<Book | null> {
  const { data, error } = await supabaseClient
    .from("books_with_series")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapRowToBook(data as BookWithSeriesRow);
}

export async function createBook(input: BookInput): Promise<Book> {
  const insertRow = {
    title: input.title,
    author: input.author,
    genre: input.genre ?? null,
    description: input.description ?? null,
    isbn: input.isbn ?? null,
    cover_url: input.coverUrl ?? null,
    published_year: input.publishedYear ?? null,
    finished: input.finished ?? false,
    format: input.format ?? null,
    pages: input.pages ?? null,
    read_by_dane: input.readByDane ?? false,
    read_by_emma: input.readByEmma ?? false,
    ownership_status: input.ownershipStatus ?? "owned",
  };

  const { data, error } = await supabaseClient
    .from("books")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to create book in Supabase.");
  }
  const withSeries = await getBook(data.id);
  if (withSeries) {
    return withSeries;
  }

  return mapRowToBook({
    ...(data as BookRow),
    series_id: null,
    series_name: null,
    series_label: null,
    series_sort: null,
  });
}

export async function updateBook(
  id: string,
  patch: Partial<BookInput>,
): Promise<Book> {
  const updateRow: Partial<BookRow> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.title !== undefined) updateRow.title = patch.title;
  if (patch.author !== undefined) updateRow.author = patch.author;
  if (patch.genre !== undefined) updateRow.genre = patch.genre ?? null;
  if (patch.description !== undefined)
    updateRow.description = patch.description ?? null;
  if (patch.isbn !== undefined) updateRow.isbn = patch.isbn ?? null;
  if (patch.coverUrl !== undefined)
    updateRow.cover_url = patch.coverUrl ?? null;
  if (patch.publishedYear !== undefined)
    updateRow.published_year = patch.publishedYear ?? null;
  if (patch.finished !== undefined) updateRow.finished = patch.finished;
  if (patch.format !== undefined) updateRow.format = patch.format ?? null;
  if (patch.pages !== undefined) updateRow.pages = patch.pages ?? null;
  if (patch.readByDane !== undefined) updateRow.read_by_dane = patch.readByDane;
  if (patch.readByEmma !== undefined) updateRow.read_by_emma = patch.readByEmma;
  if (patch.ownershipStatus !== undefined)
    updateRow.ownership_status = patch.ownershipStatus;

  const { data, error } = await supabaseClient
    .from("books")
    .update(updateRow)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to update book in Supabase.");
  }
  const withSeries = await getBook(data.id);
  if (withSeries) {
    return withSeries;
  }

  return mapRowToBook({
    ...(data as BookRow),
    series_id: null,
    series_name: null,
    series_label: null,
    series_sort: null,
  });
}

export async function softDeleteBook(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from("books")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteBook(id: string): Promise<void> {
  const { data, error } = await supabaseClient
    .from("books")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Delete failed or was not permitted.");
  }
}

import { supabase } from "../lib/supabaseClient";
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
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA ?? "library";

function toTimestamp(value: string | null): number {
  if (!value) {
    return Date.now();
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function mapRowToBook(row: BookRow): Book {
  const createdAt = toTimestamp(row.created_at);
  const updatedAt = row.updated_at ? toTimestamp(row.updated_at) : createdAt;

  return {
    id: row.id,
    title: row.title ?? "",
    author: row.author ?? "",
    genre: row.genre ?? null,
    description: row.description ?? null,
    isbn: row.isbn ?? null,
    finished: false,
    coverUrl: row.cover_url ?? null,
    readByDane: false,
    readByEmma: false,
    format: undefined,
    pages: undefined,
    createdAt,
    updatedAt,
  };
}

export async function listBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .schema(supabaseSchema)
    .from("books")
    .select("*")
    .is("deleted_at", null)
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRowToBook(row as BookRow));
}

export async function getBook(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .schema(supabaseSchema)
    .from("books")
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

  return mapRowToBook(data as BookRow);
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
  };

  const { data, error } = await supabase
    .schema(supabaseSchema)
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

  return mapRowToBook(data as BookRow);
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

  const { data, error } = await supabase
    .schema(supabaseSchema)
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

  return mapRowToBook(data as BookRow);
}

export async function softDeleteBook(id: string): Promise<void> {
  const { error } = await supabase
    .schema(supabaseSchema)
    .from("books")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

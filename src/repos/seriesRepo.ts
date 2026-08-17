import { getSupabaseClientWithSchema } from "../lib/supabaseSchema";
import { getActiveLibraryIdForRepos } from "../features/libraries/activeLibraryState";
import type { Series } from "../features/books/lib/bookTypes";

const supabaseClient = getSupabaseClientWithSchema();

type SeriesRow = {
  id: string;
  name: string;
  parent_series_id: string | null;
};

function mapRowToSeries(row: SeriesRow): Series {
  return {
    id: row.id,
    name: row.name,
    parentSeriesId: row.parent_series_id ?? null,
  };
}

export async function listSeries(): Promise<Series[]> {
  let query = supabaseClient
    .from("series")
    .select("*")
    .order("name", { ascending: true });
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (activeLibraryId) {
    query = query.eq("library_id", activeLibraryId);
  }
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRowToSeries(row as SeriesRow));
}

export async function findSeriesByName(name: string): Promise<Series | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  let query = supabaseClient
    .from("series")
    .select("*")
    .ilike("name", trimmed);
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (activeLibraryId) {
    query = query.eq("library_id", activeLibraryId);
  }
  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  return mapRowToSeries(data as SeriesRow);
}

export async function createSeries(
  name: string,
  parentSeriesId?: string | null,
): Promise<Series> {
  const activeLibraryId = getActiveLibraryIdForRepos();
  if (!activeLibraryId) {
    throw new Error("Choose a library before creating a series.");
  }

  const { data, error } = await supabaseClient
    .from("series")
    .insert({
      library_id: activeLibraryId,
      name: name.trim(),
      parent_series_id: parentSeriesId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to create series.");
  }

  return mapRowToSeries(data as SeriesRow);
}

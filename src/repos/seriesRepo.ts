import { supabase } from "../lib/supabaseClient";
import type { Series } from "../features/books/bookTypes";

const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA ?? "library";

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
  const { data, error } = await supabase
    .schema(supabaseSchema)
    .from("series")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRowToSeries(row as SeriesRow));
}

export async function findSeriesByName(name: string): Promise<Series | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .schema(supabaseSchema)
    .from("series")
    .select("*")
    .ilike("name", trimmed)
    .maybeSingle();

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
  const { data, error } = await supabase
    .schema(supabaseSchema)
    .from("series")
    .insert({
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

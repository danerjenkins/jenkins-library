import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

const rawSchema = import.meta.env.VITE_SUPABASE_SCHEMA;
const trimmedSchema = rawSchema?.trim();
const supabaseSchema =
  trimmedSchema && trimmedSchema.length > 0 ? trimmedSchema : undefined;

type SupabaseClientOrSchemaClient =
  | SupabaseClient
  | ReturnType<typeof supabase.schema>;

export function getSupabaseClientWithSchema(): SupabaseClientOrSchemaClient {
  if (supabaseSchema) {
    return supabase.schema(supabaseSchema);
  }
  return supabase;
}

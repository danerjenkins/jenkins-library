// Service-role client for the feedback CLIs. Reads SUPABASE_URL (or VITE_SUPABASE_URL) and
// SUPABASE_SERVICE_ROLE_KEY from the environment, then .env.local, then .env.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

export const repoRoot = resolve(import.meta.dirname, "..", "..");
export const SCREENSHOT_BUCKET = "library-feedback";

export function createServiceClient() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(repoRoot, name);
    if (existsSync(path)) process.loadEnvFile(path);
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "library" },
  });
}

export type ServiceClient = ReturnType<typeof createServiceClient>;

/** Accepts a full id or a unique prefix of at least six characters. */
export async function resolveReportId(client: ServiceClient, idOrPrefix: string): Promise<string> {
  const { data, error } = await client.rpc("feedback_report_ids_by_prefix", {
    p_prefix: idOrPrefix.trim(),
  });
  if (error) throw new Error(error.message);

  const matches = data as string[];
  if (matches.length === 0) throw new Error(`No report matches "${idOrPrefix}".`);
  if (matches.length > 1) throw new Error(`"${idOrPrefix}" matches several reports.`);
  return matches[0];
}

export async function runCli(main: () => Promise<void>) {
  try {
    await main();
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

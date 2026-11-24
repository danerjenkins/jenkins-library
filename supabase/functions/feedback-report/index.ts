// Feedback intake. Public visitors may report, so deploy with verify_jwt = false;
// a signed-in reporter is identified from their bearer token when one is sent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const BUCKET = "library-feedback";
const RATE_WINDOW_MS = 2 * 60 * 1000;
const RATE_LIMIT_PER_REPORTER = 6;
// Anonymous session ids are client-chosen, so all guests also share a ceiling.
const RATE_LIMIT_ALL_GUESTS = 20;
const SCREENSHOT_MAX_BYTES = 6 * 1024 * 1024;
const BODY_MAX_BYTES = 9 * 1024 * 1024;
const CONTEXT_MAX_CHARS = 256 * 1024;
const KINDS = ["bug", "confusing", "idea"];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

function clampString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeScreenshot(dataUrl: unknown): Uint8Array | null {
  const prefix = "data:image/png;base64,";
  if (typeof dataUrl !== "string" || !dataUrl.startsWith(prefix)) return null;
  const base64 = dataUrl.slice(prefix.length);
  if ((base64.length * 3) / 4 > SCREENSHOT_MAX_BYTES) return null;
  try {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte) ? bytes : null;
  } catch {
    return null;
  }
}

function normalizeContext(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  return JSON.stringify(value).length <= CONTEXT_MAX_CHARS
    ? value
    : { truncated: true, url: clampString(value.url, 300) };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    if (Number(request.headers.get("content-length") ?? 0) > BODY_MAX_BYTES) {
      return jsonResponse({ error: "Report is too large." }, 413);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON." }, 400);
    }
    if (!isRecord(body)) {
      return jsonResponse({ error: "Invalid report." }, 400);
    }

    const serviceClient = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } },
    );
    const db = serviceClient.schema("library");

    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    const { data: caller } = token
      ? await serviceClient.auth.getUser(token)
      : { data: { user: null } };
    const userId = caller.user?.id ?? null;

    const sessionId = clampString(body.session_id, 80);
    const expectation = clampString(body.expectation, 2000);
    const screenshot = decodeScreenshot(body.screenshot);
    if (!sessionId) {
      return jsonResponse({ error: "Missing session." }, 400);
    }
    if (!expectation && !screenshot) {
      return jsonResponse({ error: "Add a description or a screenshot." }, 400);
    }

    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const countRecent = () =>
      db.from("bug_reports")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since);
    const { count: reporterCount, error: rateError } = userId
      ? await countRecent().eq("user_id", userId)
      : await countRecent().is("user_id", null).eq("session_id", sessionId);
    if (rateError) throw rateError;

    let throttled = (reporterCount ?? 0) >= RATE_LIMIT_PER_REPORTER;
    if (!userId && !throttled) {
      const { count: guestCount, error } = await countRecent().is("user_id", null);
      if (error) throw error;
      throttled = (guestCount ?? 0) >= RATE_LIMIT_ALL_GUESTS;
    }
    if (throttled) {
      return jsonResponse({ ok: true, throttled: true });
    }

    // Stamp the library and role from the database, never from the client.
    let libraryId: string | null = null;
    const requestedLibraryId = clampString(body.library_id, 36);
    if (requestedLibraryId && UUID_PATTERN.test(requestedLibraryId)) {
      const { data } = await db
        .from("libraries")
        .select("id")
        .eq("id", requestedLibraryId)
        .maybeSingle();
      libraryId = data?.id ?? null;
    }
    let reporterRole = "guest";
    if (userId && libraryId) {
      const { data } = await db
        .from("library_members")
        .select("role")
        .eq("library_id", libraryId)
        .eq("user_id", userId)
        .maybeSingle();
      reporterRole = data?.role ?? "guest";
    }

    const id = crypto.randomUUID();
    let screenshotPath: string | null = null;
    if (screenshot) {
      const path = `${id}/screenshot.png`;
      const { error } = await serviceClient.storage
        .from(BUCKET)
        .upload(path, screenshot, { contentType: "image/png" });
      if (error) {
        console.warn("Screenshot upload failed:", error.message);
      } else {
        screenshotPath = path;
      }
    }

    const { error: insertError } = await db.from("bug_reports").insert({
      id,
      user_id: userId,
      kind: KINDS.includes(body.kind as string) ? body.kind : "bug",
      expectation,
      route: clampString(body.route, 256),
      app_version: clampString(body.app_version, 40),
      app_commit: clampString(body.app_commit, 12),
      session_id: sessionId,
      context: normalizeContext(body.context),
      screenshot_path: screenshotPath,
      library_id: libraryId,
      reporter_role: reporterRole,
    });
    if (insertError) {
      if (screenshotPath) {
        await serviceClient.storage.from(BUCKET).remove([screenshotPath]);
      }
      throw insertError;
    }

    const { error: eventError } = await db.from("bug_events").insert({
      bug_id: id,
      kind: "created",
      to_status: "open",
      via: "reporter",
      actor_id: userId,
    });
    if (eventError) {
      console.error("Feedback event failed:", eventError.message);
    }

    return jsonResponse({ ok: true, id });
  } catch (error) {
    console.error("Feedback intake failed:", error);
    return jsonResponse({ error: "Could not save the report." }, 500);
  }
});

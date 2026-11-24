import { supabase } from "../lib/supabaseClient";
import { getSupabaseClientWithSchema } from "../lib/supabaseSchema";
import type {
  BugEvent,
  BugMessage,
  BugReport,
  BugReportListItem,
  FeedbackResolution,
  FeedbackSeverity,
  FeedbackStatus,
  MyReport,
} from "../features/feedback/lib/feedbackTypes";

const supabaseClient = getSupabaseClientWithSchema();

const SCREENSHOT_BUCKET = "library-feedback";
const SIGNED_URL_SECONDS = 15 * 60;
const LIST_LIMIT = 200;

const LIST_COLUMNS =
  "id, user_id, source, kind, expectation, route, app_version, app_commit, session_id, screenshot_path, reporter_role, severity, summary, status, created_at, triaged_at, resolved_at, resolved_via, resolution, fixed_commit, duplicate_of, reporter_note, last_message_role";
const MY_COLUMNS =
  "id, kind, expectation, route, screenshot_path, status, created_at, triaged_at, resolved_at, resolution, reporter_note";

/** Which queue: people's reports, our own QA passes, or both. */
export type FeedbackQueue = "people" | "passes" | "all";

async function callRpc(name: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabaseClient.rpc(name, args);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getIsFeedbackAdmin(): Promise<boolean> {
  return (await callRpc("current_user_is_feedback_admin")) === true;
}

export async function getUnreadFeedbackCount(): Promise<number> {
  return Number(await callRpc("feedback_unread_count"));
}

export async function markFeedbackSeen(): Promise<void> {
  await callRpc("feedback_mark_seen");
}

export async function listMyReports(userId: string): Promise<MyReport[]> {
  const { data, error } = await supabaseClient
    .from("bug_reports")
    .select(MY_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as MyReport[];
}

export async function listReports(
  status: FeedbackStatus,
  queue: FeedbackQueue,
): Promise<BugReportListItem[]> {
  let query = supabaseClient
    .from("bug_reports")
    .select(LIST_COLUMNS)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (queue === "people") query = query.eq("source", "user");
  if (queue === "passes") query = query.neq("source", "user");

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as BugReportListItem[];
}

export async function getReport(id: string): Promise<BugReport | null> {
  const { data, error } = await supabaseClient
    .from("bug_reports")
    .select(`${LIST_COLUMNS}, context`)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as BugReport | null;
}

export async function listMessages(bugIds: string[]): Promise<BugMessage[]> {
  if (bugIds.length === 0) return [];

  const { data, error } = await supabaseClient
    .from("bug_messages")
    .select("id, bug_id, sender_role, body, created_at")
    .in("bug_id", bugIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BugMessage[];
}

export async function listEvents(bugId: string): Promise<BugEvent[]> {
  const { data, error } = await supabaseClient
    .from("bug_events")
    .select("id, at, kind, via, resolution, note")
    .eq("bug_id", bugId)
    .order("at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BugEvent[];
}

export async function getReporterName(userId: string): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as { display_name: string } | null)?.display_name ?? null;
}

/** Signed URLs by storage path. Missing screenshots are simply left out. */
export async function getScreenshotUrls(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    data.flatMap(({ path, signedUrl }) =>
      path && signedUrl ? [[path, signedUrl] as const] : [],
    ),
  );
}

/** Accepts a full id or the short prefix shown in the inbox. */
export async function resolveReportId(idOrPrefix: string): Promise<string> {
  const matches = (await callRpc("feedback_report_ids_by_prefix", {
    p_prefix: idOrPrefix.trim(),
  })) as string[];

  if (matches.length !== 1) {
    throw new Error(
      matches.length > 1
        ? "That id matches several reports. Use more characters."
        : "No report matches that id.",
    );
  }

  return matches[0];
}

export async function resolveReport(
  id: string,
  input: {
    resolution: FeedbackResolution;
    reporterNote?: string;
    fixedCommit?: string;
    duplicateOf?: string;
  },
): Promise<void> {
  const duplicateOf = input.duplicateOf ? await resolveReportId(input.duplicateOf) : null;
  await callRpc("feedback_resolve", {
    p_id: id,
    p_resolution: input.resolution,
    p_reporter_note: input.reporterNote ?? null,
    p_fixed_commit: input.fixedCommit ?? null,
    p_duplicate_of: duplicateOf,
  });
}

export async function reopenReport(id: string): Promise<void> {
  await callRpc("feedback_reopen", { p_id: id });
}

export async function triageReport(
  id: string,
  severity: FeedbackSeverity | null,
  summary: string,
): Promise<void> {
  await callRpc("feedback_triage", { p_id: id, p_severity: severity, p_summary: summary });
}

export async function askReporter(id: string, body: string): Promise<void> {
  await callRpc("feedback_ask", { p_id: id, p_body: body });
}

export async function replyToReport(id: string, body: string): Promise<void> {
  await callRpc("feedback_reply", { p_id: id, p_body: body });
}

export type FeedbackKind = "bug" | "confusing" | "idea";
export type FeedbackStatus = "open" | "triaged" | "resolved";
export type FeedbackSeverity = "low" | "med" | "high";
export type FeedbackResolution = "fixed" | "noise" | "duplicate" | "wontfix" | "by_design";

export interface Breadcrumb {
  t: number;
  type: "nav" | "click" | "input";
  detail: string;
}

export interface ConsoleEntry {
  t: number;
  level: "log" | "info" | "warn" | "error";
  text: string;
}

export interface NetworkEntry {
  t: number;
  method: string;
  url: string;
  status: number;
  ms: number;
  ok: boolean;
}

export interface ErrorEntry {
  t: number;
  message: string;
  stack?: string;
  source?: string;
}

export interface FeedbackContext {
  session_id: string;
  captured_at: string;
  url: string;
  title: string;
  user_agent: string;
  viewport: { w: number; h: number; dpr: number };
  color_scheme: "dark" | "light";
  timezone: string;
  locale: string;
  scroll: { x: number; y: number };
  last_element: { selector: string; text: string } | null;
  perf: {
    load_ms?: number;
    ttfb_ms?: number;
    dom_ms?: number;
    long_tasks?: number;
    heap_used_mb?: number;
    heap_limit_mb?: number;
    connection?: { type?: string; downlink?: number; rtt?: number };
  };
  breadcrumbs: Breadcrumb[];
  console: ConsoleEntry[];
  network: NetworkEntry[];
  errors: ErrorEntry[];
}

/** Payload posted to the feedback-report edge function. */
export interface FeedbackBundle {
  kind: FeedbackKind;
  expectation: string;
  route: string;
  app_version: string;
  app_commit: string;
  session_id: string;
  library_id: string | null;
  context: FeedbackContext;
  screenshot: string | null;
}

/** A library.bug_reports row. */
export interface BugReport {
  id: string;
  user_id: string | null;
  source: string;
  kind: FeedbackKind;
  expectation: string | null;
  route: string | null;
  app_version: string | null;
  app_commit: string | null;
  session_id: string | null;
  context: Partial<FeedbackContext>;
  screenshot_path: string | null;
  reporter_role: "admin" | "editor" | "member" | "guest" | null;
  severity: FeedbackSeverity | null;
  summary: string | null;
  status: FeedbackStatus;
  created_at: string;
  triaged_at: string | null;
  resolved_at: string | null;
  resolved_via: string | null;
  resolution: FeedbackResolution | null;
  fixed_commit: string | null;
  duplicate_of: string | null;
  reporter_note: string | null;
  last_message_role: "reporter" | "team" | null;
}

/** The columns a reporter's own page needs; triage fields stay out of it. */
export type MyReport = Pick<
  BugReport,
  | "id"
  | "kind"
  | "expectation"
  | "route"
  | "screenshot_path"
  | "status"
  | "created_at"
  | "triaged_at"
  | "resolved_at"
  | "resolution"
  | "reporter_note"
>;

/** Inbox rows leave the large context out. */
export type BugReportListItem = Omit<BugReport, "context">;

export interface BugMessage {
  id: string;
  bug_id: string;
  sender_role: "reporter" | "team";
  body: string;
  created_at: string;
}

export interface BugEvent {
  id: string;
  at: string;
  kind: "created" | "triaged" | "resolved" | "reopened";
  via: string | null;
  resolution: FeedbackResolution | null;
  note: string | null;
}

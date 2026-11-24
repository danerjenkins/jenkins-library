// Pure, type-only imports: shared by the inbox and scripts/bug-pull.ts (run directly by Node).
import type { BugReport } from "./feedbackTypes";

function clock(t: number) {
  const date = new Date(t);
  return Number.isNaN(date.getTime()) ? "??:??:??" : date.toISOString().slice(11, 19);
}

function list<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/** Render a report as a readable brief for a coding agent. */
export function buildRepairMarkdown(report: BugReport): string {
  const context = report.context ?? {};
  const lines: string[] = [];
  const severity = report.severity ? ` · ${report.severity}` : "";

  lines.push(`# bug ${report.id.slice(0, 8)} · ${report.kind}${severity}`, "");
  lines.push(`- **status:** ${report.status}${report.resolution ? ` (${report.resolution})` : ""}`);
  lines.push(`- **expected:** ${report.expectation?.trim() || "(no note, see context)"}`);
  if (report.summary) lines.push(`- **triage summary:** ${report.summary}`);
  lines.push(
    `- **screen + version:** ${context.url ?? report.route ?? "?"} · v${report.app_version ?? "?"}${report.app_commit ? ` (${report.app_commit})` : ""}`,
    `- **when + session:** ${report.created_at} · ${report.session_id ?? "?"}`,
    `- **reporter:** ${report.reporter_role ?? "unknown"}${report.user_id ? ` ${report.user_id.slice(0, 8)}` : ""} · source ${report.source}`,
  );
  if (context.user_agent) lines.push(`- **agent:** ${context.user_agent}`);
  if (context.viewport) {
    const { w, h, dpr } = context.viewport;
    lines.push(
      `- **viewport:** ${w}x${h} @${dpr}x · ${context.color_scheme ?? "?"} · ${context.timezone ?? "?"} · ${context.locale ?? "?"}`,
    );
  }
  if (context.last_element) {
    const { selector, text } = context.last_element;
    lines.push(`- **last interaction:** \`${selector}\` "${text}"`);
  }
  if (context.scroll) lines.push(`- **scroll:** ${context.scroll.x},${context.scroll.y}`);
  if (context.perf) {
    const { load_ms, ttfb_ms, dom_ms, long_tasks, heap_used_mb, heap_limit_mb, connection } =
      context.perf;
    const heap = heap_used_mb ? ` · heap ${heap_used_mb}/${heap_limit_mb}MB` : "";
    const network = connection?.type ? ` · ${connection.type}` : "";
    lines.push(
      `- **perf:** load ${load_ms ?? "?"}ms · ttfb ${ttfb_ms ?? "?"}ms · dom ${dom_ms ?? "?"}ms · long tasks ${long_tasks ?? 0}${heap}${network}`,
    );
  }

  const errors = list(context.errors);
  if (errors.length > 0) {
    lines.push("", "## errors (thrown)");
    for (const error of errors) {
      lines.push(`- ${clock(error.t)} ${error.message}${error.source ? ` (${error.source})` : ""}`);
      if (error.stack) {
        const frames = error.stack.split("\n").slice(0, 7);
        lines.push("  ```", ...frames.map((frame) => `  ${frame}`), "  ```");
      }
    }
  }

  const failed = list(context.network).filter((request) => !request.ok);
  if (failed.length > 0) {
    lines.push("", "## failed requests");
    for (const { t, method, url, status, ms } of failed) {
      lines.push(`- ${clock(t)} ${method} ${url} -> ${status} (${ms}ms)`);
    }
  }

  const consoleEntries = list(context.console);
  if (consoleEntries.length > 0) {
    lines.push("", "## console");
    for (const { t, level, text } of consoleEntries) lines.push(`- ${clock(t)} [${level}] ${text}`);
  }

  const breadcrumbs = list(context.breadcrumbs);
  if (breadcrumbs.length > 0) {
    lines.push("", "## what they did");
    for (const { t, type, detail } of breadcrumbs) lines.push(`- ${clock(t)} ${type} ${detail}`);
  }

  lines.push(
    "",
    "## screenshot",
    report.screenshot_path
      ? `- saved to library-feedback/${report.screenshot_path} (downloaded alongside as screenshot.png)`
      : "- none captured",
  );

  return `${lines.join("\n")}\n`;
}

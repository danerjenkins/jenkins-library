import type { ReactNode } from "react";
import { PageSection } from "../../../ui/components/PageLayout";
import type { FeedbackContext } from "../lib/feedbackTypes";

export function InboxSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageSection className="space-y-3">
      <h3 className="font-display text-lg font-bold text-stone-900">{title}</h3>
      {children}
    </PageSection>
  );
}

function clock(t: number) {
  return new Date(t).toLocaleTimeString();
}

function Entries({ title, lines }: { title: string; lines: ReactNode[] }) {
  if (lines.length === 0) return null;
  return (
    <InboxSection title={title}>
      <ul className="space-y-1.5 break-words font-mono text-xs text-stone-800">
        {lines.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
    </InboxSection>
  );
}

/** The captured bundle as readable widgets. Every ring may be missing on a truncated report. */
export function ReportContext({ context }: { context: Partial<FeedbackContext> }) {
  const { breadcrumbs = [], errors = [], network = [], last_element, viewport, perf } = context;
  const consoleProblems = (context.console ?? []).filter(
    ({ level }) => level === "error" || level === "warn",
  );
  const environment = [
    ["Page", context.url],
    ["Title", context.title],
    ["Last clicked", last_element && `${last_element.selector} "${last_element.text}"`],
    ["Viewport", viewport && `${viewport.w} x ${viewport.h} @${viewport.dpr}x`],
    ["Scroll", context.scroll && `${context.scroll.x}, ${context.scroll.y}`],
    ["Locale", context.locale && `${context.locale}, ${context.timezone}, ${context.color_scheme}`],
    ["Load", perf && `${perf.load_ms ?? "?"}ms, ${perf.long_tasks ?? 0} long tasks`],
    ["Connection", perf?.connection?.type],
    ["Browser", context.user_agent],
  ].filter(([, value]) => value);

  return (
    <>
      <Entries
        title="Thrown Errors"
        lines={errors.map(({ t, message, source, stack }) => (
          <span className="text-rose-700">
            {clock(t)} {message} {source ? `(${source})` : ""}
            {stack ? <pre className="mt-1 whitespace-pre-wrap">{stack}</pre> : null}
          </span>
        ))}
      />
      <Entries
        title="Failed Requests"
        lines={network
          .filter(({ ok }) => !ok)
          .map(({ t, method, url, status, ms }) => (
            <span className="text-rose-700">
              {clock(t)} {method} {url} returned {status || "no response"} ({ms}ms)
            </span>
          ))}
      />
      <Entries
        title="Console Warnings And Errors"
        lines={consoleProblems.map(({ t, level, text }) => `${clock(t)} [${level}] ${text}`)}
      />
      <Entries
        title="What They Did"
        lines={breadcrumbs.map(({ t, type, detail }) => `${clock(t)} ${type} ${detail}`)}
      />
      {environment.length > 0 ? (
        <InboxSection title="Environment">
          <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[7rem_1fr]">
            {environment.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-semibold text-stone-700">{label}</dt>
                <dd className="min-w-0 break-words text-stone-800">{value}</dd>
              </div>
            ))}
          </dl>
        </InboxSection>
      ) : null}
    </>
  );
}

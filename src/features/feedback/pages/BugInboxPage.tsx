import { useEffect, useState } from "react";
import { Bug, Camera, CircleHelp, Lightbulb } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { listReports, type FeedbackQueue } from "../../../repos/feedbackRepo";
import { Badge } from "../../../ui/components/Badge";
import { LoadingState } from "../../../ui/components/LoadingState";
import { PageHero, PageLayout, PageSection } from "../../../ui/components/PageLayout";
import { Select } from "../../../ui/components/Select";
import { KIND_LABELS, RESOLUTION_LABELS, timeAgo } from "../lib/feedbackLabels";
import type { BugReportListItem, FeedbackStatus } from "../lib/feedbackTypes";

const STATUS_TABS: { value: FeedbackStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "triaged", label: "Triaged" },
  { value: "resolved", label: "Resolved" },
];
const QUEUE_OPTIONS: { value: FeedbackQueue; label: string }[] = [
  { value: "people", label: "From people" },
  { value: "passes", label: "From our passes" },
  { value: "all", label: "All" },
];
const KIND_ICONS = { bug: Bug, confusing: CircleHelp, idea: Lightbulb };

function ReportRow({ report }: { report: BugReportListItem }) {
  const Icon = KIND_ICONS[report.kind];
  const meta = [
    report.route ?? "/",
    `v${report.app_version ?? "?"}`,
    timeAgo(report.created_at),
    report.source === "user" ? null : report.source,
    report.last_message_role === "reporter" ? "new reply" : null,
  ].filter(Boolean);

  return (
    <li>
      <Link
        to={`/admin/bugs/${report.id}`}
        className="flex items-start gap-3 px-1 py-3 no-underline hover:bg-parchment/70 sm:px-3"
      >
        <Icon
          className="mt-0.5 h-5 w-5 shrink-0 text-wood"
          aria-label={KIND_LABELS[report.kind]}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-stone-900">
            {report.summary ?? report.expectation ?? `(${report.kind}, no note, see context)`}
          </span>
          <span className="block truncate text-xs text-stone-600">{meta.join(" · ")}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {report.severity ? (
            <Badge variant={report.severity === "high" ? "amber" : "default"}>
              {report.severity}
            </Badge>
          ) : null}
          {report.resolution ? (
            <Badge variant={report.resolution === "fixed" ? "success" : "default"}>
              {RESOLUTION_LABELS[report.resolution]}
            </Badge>
          ) : null}
          {report.screenshot_path ? (
            <Camera className="h-4 w-4 text-wood" aria-label="Has a screenshot" />
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export function BugInboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status =
    STATUS_TABS.find(({ value }) => value === searchParams.get("status"))?.value ?? "open";
  const queue =
    QUEUE_OPTIONS.find(({ value }) => value === searchParams.get("queue"))?.value ?? "people";
  const viewKey = `${status}:${queue}`;
  const [result, setResult] = useState<{
    viewKey: string;
    reports: BugReportListItem[];
    errorMessage: string | null;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    listReports(status, queue)
      .then((reports) => {
        if (!ignore) setResult({ viewKey, reports, errorMessage: null });
      })
      .catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : "Unable to load feedback.";
        if (!ignore) setResult({ viewKey, reports: [], errorMessage });
      });
    return () => {
      ignore = true;
    };
  }, [queue, status, viewKey]);

  const setFilter = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(name, value);
    setSearchParams(next, { replace: true });
  };
  const current = result?.viewKey === viewKey ? result : null;

  return (
    <PageLayout>
      <PageHero title="Feedback Inbox" description="Reports sent from the Feedback button." />

      <PageSection className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-warm-gray bg-cream p-1">
            {STATUS_TABS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={status === value}
                className="feedback-choice"
                onClick={() => setFilter("status", value)}
              >
                {label}
              </button>
            ))}
          </div>
          <Select
            id="feedback-queue"
            label="Queue"
            value={queue}
            options={QUEUE_OPTIONS}
            onChange={(event) => setFilter("queue", event.target.value)}
          />
        </div>

        {current === null ? (
          <LoadingState title="Loading Feedback" variant="panel" />
        ) : current.errorMessage ? (
          <p role="alert" className="text-rose-700">
            {current.errorMessage}
          </p>
        ) : current.reports.length === 0 ? (
          <p>Nothing {status} here.</p>
        ) : (
          <ul className="divide-y divide-warm-gray">
            {current.reports.map((report) => (
              <ReportRow key={report.id} report={report} />
            ))}
          </ul>
        )}
      </PageSection>
    </PageLayout>
  );
}

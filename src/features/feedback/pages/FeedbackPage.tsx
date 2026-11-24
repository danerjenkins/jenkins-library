import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Inbox, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../app/auth/useAuth";
import {
  getScreenshotUrls,
  listMessages,
  listMyReports,
  markFeedbackSeen,
  reopenReport,
  replyToReport,
} from "../../../repos/feedbackRepo";
import { Badge } from "../../../ui/components/Badge";
import { Button } from "../../../ui/components/Button";
import { LoadingState } from "../../../ui/components/LoadingState";
import { PageHero, PageLayout, PageSection } from "../../../ui/components/PageLayout";
import { FeedbackThread } from "../components/FeedbackThread";
import { useIsFeedbackAdmin } from "../hooks/useIsFeedbackAdmin";
import { announceFeedbackSeen, openFeedback } from "../lib/feedbackEvents";
import { formatDateTime, KIND_LABELS, reporterStatus } from "../lib/feedbackLabels";
import type { BugMessage, MyReport } from "../lib/feedbackTypes";

interface FeedbackData {
  reports: MyReport[];
  messages: BugMessage[];
  screenshots: Map<string, string>;
}

async function loadFeedback(userId: string): Promise<FeedbackData> {
  const reports = await listMyReports(userId);
  const paths = reports.flatMap(({ screenshot_path }) => screenshot_path ?? []);
  const [messages, screenshots] = await Promise.all([
    listMessages(reports.map(({ id }) => id)),
    getScreenshotUrls(paths).catch(() => new Map<string, string>()),
  ]);
  return { reports, messages, screenshots };
}

interface ReportCardProps {
  report: MyReport;
  messages: BugMessage[];
  screenshotUrl: string | undefined;
  onChanged: () => Promise<void>;
}

function ReportCard({ report, messages, screenshotUrl, onChanged }: ReportCardProps) {
  const [reply, setReply] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const status = reporterStatus(report);
  const timeline = [
    { label: "Submitted", at: report.created_at },
    { label: "Reviewing", at: report.triaged_at },
    { label: status, at: report.resolved_at },
  ];

  async function run(action: () => Promise<void>) {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await action();
      await onChanged();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "That didn't work. Try again.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await replyToReport(report.id, reply);
      setReply("");
    });
  }

  return (
    <PageSection className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-stone-600">
          {KIND_LABELS[report.kind]} on {report.route ?? "the app"}
        </span>
        <Badge variant={status === "Fixed" ? "success" : status === "Reviewing" ? "amber" : "default"}>
          {status}
        </Badge>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-stone-900">
          {report.expectation ?? "You sent a screenshot."}
        </p>
        {screenshotUrl ? (
          <a href={screenshotUrl} target="_blank" rel="noreferrer" className="shrink-0">
            <img
              src={screenshotUrl}
              alt="The screenshot you sent"
              className="h-28 w-40 rounded-lg border border-warm-gray object-cover object-top"
            />
          </a>
        ) : null}
      </div>

      <ol className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-600">
        {timeline.map(({ label, at }) =>
          at ? (
            <li key={label}>
              <span className="font-semibold text-stone-800">{label}</span> {formatDateTime(at)}
            </li>
          ) : null,
        )}
      </ol>

      {report.reporter_note ? (
        <p className="rounded-lg border border-sage/25 bg-sage/10 px-3 py-2 text-sm text-ink">
          {report.reporter_note}
        </p>
      ) : null}

      <FeedbackThread messages={messages} viewer="reporter" />

      <form className="flex gap-2" onSubmit={handleReply}>
        <input
          className="ds-input min-w-0 flex-1"
          aria-label="Reply"
          placeholder="Add a reply"
          maxLength={2000}
          value={reply}
          onChange={(event) => setReply(event.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={isBusy || !reply.trim()}>
          Reply
        </Button>
      </form>

      {report.status === "resolved" ? (
        <Button
          type="button"
          variant="secondary"
          disabled={isBusy}
          onClick={() => void run(() => reopenReport(report.id))}
        >
          Still happening? Reopen it
        </Button>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}
    </PageSection>
  );
}

export function FeedbackPage() {
  const { isLoading: isAuthLoading, session } = useAuth();
  const isAdmin = useIsFeedbackAdmin();
  const userId = session?.user.id ?? null;
  const [data, setData] = useState<FeedbackData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setData(await loadFeedback(userId));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load your feedback.");
      return;
    }
    // Reading the page clears the badge; a failure only leaves it showing.
    await markFeedbackSeen().catch(() => undefined);
    announceFeedbackSeen();
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after the fetch
    void refresh();
  }, [refresh]);

  const reports = data?.reports ?? [];
  const fixedCount = reports.filter(({ resolution }) => resolution === "fixed").length;

  return (
    <PageLayout>
      <PageHero
        title="Your Feedback"
        description="What you've told us, and what we did about it."
        meta={
          reports.length > 0
            ? `You've sent ${reports.length} ${reports.length === 1 ? "report" : "reports"}, and ${fixedCount} shipped a fix.`
            : undefined
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {isAdmin ? (
              <Link to="/admin/bugs" className="ds-button ds-button--secondary gap-2 no-underline">
                <Inbox aria-hidden="true" size={16} />
                Inbox
              </Link>
            ) : null}
            <Button type="button" className="gap-2" onClick={openFeedback}>
              <MessageSquare aria-hidden="true" size={16} />
              Send Feedback
            </Button>
          </div>
        }
      />

      {errorMessage ? (
        <PageSection>
          <p role="alert" className="text-rose-700">
            {errorMessage}
          </p>
        </PageSection>
      ) : null}

      {!session && !isAuthLoading ? (
        <PageSection>
          <p>
            <Link to="/login?returnTo=%2Ffeedback">Sign in</Link> to follow what you send. Anyone can
            send feedback without an account.
          </p>
        </PageSection>
      ) : null}

      {session && !data && !errorMessage ? (
        <LoadingState title="Loading Your Feedback" variant="panel" />
      ) : null}

      {data && reports.length === 0 ? (
        <PageSection>
          <p>Nothing here yet. Use the Feedback button on any page to send your first report.</p>
        </PageSection>
      ) : null}

      {session
        ? reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              messages={data?.messages.filter(({ bug_id }) => bug_id === report.id) ?? []}
              screenshotUrl={data?.screenshots.get(report.screenshot_path ?? "")}
              onChanged={refresh}
            />
          ))
        : null}
    </PageLayout>
  );
}

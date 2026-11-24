import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ClipboardCopy, Terminal } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  askReporter,
  getReport,
  getReporterName,
  getScreenshotUrls,
  listEvents,
  listMessages,
} from "../../../repos/feedbackRepo";
import { Button } from "../../../ui/components/Button";
import { LoadingState } from "../../../ui/components/LoadingState";
import { PageHero, PageLayout, PageSection } from "../../../ui/components/PageLayout";
import { FeedbackThread } from "../components/FeedbackThread";
import { ReportActions } from "../components/ReportActions";
import { InboxSection, ReportContext } from "../components/ReportContext";
import { formatDateTime, KIND_LABELS, RESOLUTION_LABELS } from "../lib/feedbackLabels";
import type { BugEvent, BugMessage, BugReport } from "../lib/feedbackTypes";
import { buildRepairMarkdown } from "../lib/repairMarkdown";

interface ReportDetail {
  report: BugReport;
  reporterName: string | null;
  screenshotUrl: string | null;
  messages: BugMessage[];
  events: BugEvent[];
}

async function loadDetail(id: string): Promise<ReportDetail> {
  const report = await getReport(id);
  if (!report) throw new Error("That report doesn't exist.");
  const { screenshot_path: path, user_id: userId } = report;

  const [messages, events, reporterName, screenshots] = await Promise.all([
    listMessages([id]),
    listEvents(id),
    userId ? getReporterName(userId).catch(() => null) : null,
    path ? getScreenshotUrls([path]).catch(() => null) : null,
  ]);
  return {
    report,
    messages,
    events,
    reporterName,
    screenshotUrl: (path && screenshots?.get(path)) || null,
  };
}

function repairBundle(report: BugReport) {
  const context = JSON.stringify(report.context, null, 2);
  return `${buildRepairMarkdown(report)}\n## context.json\n\`\`\`json\n${context}\n\`\`\`\n`;
}

function QuestionForm({
  isBusy,
  onAsk,
}: {
  isBusy: boolean;
  onAsk: (question: string) => Promise<void>;
}) {
  const [question, setQuestion] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onAsk(question);
  }

  return (
    <form className="flex gap-2" onSubmit={(event) => void handleSubmit(event)}>
      <input
        className="ds-input min-w-0 flex-1"
        aria-label="Question for the reporter"
        placeholder="Ask the reporter a question"
        maxLength={2000}
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />
      <Button type="submit" variant="secondary" disabled={isBusy || !question.trim()}>
        Ask
      </Button>
    </form>
  );
}

export function BugDetailPage() {
  const { id = "" } = useParams();
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setDetail(await loadDetail(id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load this report.");
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(successMessage: string, action: () => Promise<void>) {
    setIsBusy(true);
    setNotice(null);
    setErrorMessage(null);
    try {
      await action();
      await refresh();
      setNotice(successMessage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "That didn't work. Try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function copy(text: string, successMessage: string) {
    setErrorMessage(null);
    try {
      await navigator.clipboard.writeText(text);
      setNotice(successMessage);
    } catch {
      setErrorMessage("This browser blocked the clipboard.");
    }
  }

  const status = (
    <div aria-live="polite">
      {notice ? (
        <p className="rounded-lg bg-sage/10 px-3 py-2 text-sm text-ink">{notice}</p>
      ) : null}
      {errorMessage ? <p className="text-sm text-rose-700">{errorMessage}</p> : null}
    </div>
  );

  if (!detail || detail.report.id !== id) {
    return (
      <PageLayout>
        {errorMessage ? (
          <PageSection>{status}</PageSection>
        ) : (
          <LoadingState title="Loading Report" variant="panel" />
        )}
      </PageLayout>
    );
  }

  const { report, reporterName, screenshotUrl, messages, events } = detail;
  const shortId = report.id.slice(0, 8);
  const fixCommand = `/fix-bug ${shortId}`;
  const reporter = report.user_id ? (reporterName ?? "Signed-in reader") : "Visitor";

  return (
    <PageLayout>
      <Link to="/admin/bugs" className="inline-flex items-center gap-2 text-sm font-semibold">
        <ArrowLeft aria-hidden="true" size={16} />
        Feedback Inbox
      </Link>

      <PageHero
        title={`${KIND_LABELS[report.kind]} ${shortId}`}
        description={`${report.route ?? "/"} · v${report.app_version ?? "?"}${report.app_commit ? ` (${report.app_commit})` : ""} · ${formatDateTime(report.created_at)} · ${report.status}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="gap-2"
              onClick={() => void copy(fixCommand, `Copied "${fixCommand}" for Claude Code.`)}
            >
              <Terminal aria-hidden="true" size={16} />
              Open in Claude Code
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => void copy(repairBundle(report), "Copied the repair bundle.")}
            >
              <ClipboardCopy aria-hidden="true" size={16} />
              Copy Repair Bundle
            </Button>
          </div>
        }
      />

      {status}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <InboxSection title="What They Said">
            <p className="whitespace-pre-wrap break-words text-stone-900">
              {report.expectation ?? "(no note, see context)"}
            </p>
            <p className="text-sm text-stone-600">
              {reporter} ({report.reporter_role ?? "unknown"}), source {report.source}
            </p>
          </InboxSection>

          {screenshotUrl ? (
            <InboxSection title="Screenshot">
              <a href={screenshotUrl} target="_blank" rel="noreferrer">
                <img
                  src={screenshotUrl}
                  alt="The reporter's screen"
                  className="max-h-[40rem] rounded-lg border border-warm-gray"
                />
              </a>
            </InboxSection>
          ) : null}

          <InboxSection title="Conversation">
            <FeedbackThread messages={messages} viewer="team" />
            {report.user_id ? (
              <QuestionForm
                key={messages.length}
                isBusy={isBusy}
                onAsk={(question) =>
                  run("Question sent.", () => askReporter(report.id, question))
                }
              />
            ) : (
              <p className="text-sm text-stone-600">
                This visitor wasn't signed in, so they can't be asked.
              </p>
            )}
          </InboxSection>

          <ReportContext context={report.context} />
        </div>

        <div className="space-y-6">
          <ReportActions
            key={`${report.id}:${report.status}`}
            report={report}
            isBusy={isBusy}
            run={run}
          />
          <InboxSection title="History">
            <ol className="space-y-1.5 text-sm text-stone-800">
              {events.map((event) => (
                <li key={event.id}>
                  <span className="font-semibold capitalize">{event.kind}</span>
                  {event.resolution ? ` as ${RESOLUTION_LABELS[event.resolution].toLowerCase()}` : ""}
                  {event.via ? ` via ${event.via}` : ""}, {formatDateTime(event.at)}
                </li>
              ))}
            </ol>
          </InboxSection>
        </div>
      </div>
    </PageLayout>
  );
}

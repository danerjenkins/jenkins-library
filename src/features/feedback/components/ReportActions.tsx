import { useState } from "react";
import { reopenReport, resolveReport, triageReport } from "../../../repos/feedbackRepo";
import { Button } from "../../../ui/components/Button";
import { Input } from "../../../ui/components/Input";
import { RESOLUTION_LABELS } from "../lib/feedbackLabels";
import type { BugReport, FeedbackResolution, FeedbackSeverity } from "../lib/feedbackTypes";
import { InboxSection } from "./ReportContext";

const SEVERITIES: FeedbackSeverity[] = ["low", "med", "high"];
const QUICK_CLOSES: FeedbackResolution[] = ["noise", "wontfix", "by_design"];

interface ReportActionsProps {
  report: BugReport;
  isBusy: boolean;
  /** Run an action, then report success or failure and reload. */
  run: (successMessage: string, action: () => Promise<void>) => Promise<void>;
}

function ReopenPanel({ report, isBusy, run }: ReportActionsProps) {
  return (
    <InboxSection title="Resolution">
      <p className="text-sm text-stone-800">
        {report.resolution ? RESOLUTION_LABELS[report.resolution] : "Resolved"} via{" "}
        {report.resolved_via}
        {report.fixed_commit ? ` in ${report.fixed_commit}` : ""}
        {report.duplicate_of ? ` of ${report.duplicate_of.slice(0, 8)}` : ""}
      </p>
      {report.reporter_note ? (
        <p className="rounded-lg bg-sage/10 px-3 py-2 text-sm text-ink">{report.reporter_note}</p>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        disabled={isBusy}
        onClick={() => void run("Reopened.", () => reopenReport(report.id))}
      >
        Reopen
      </Button>
    </InboxSection>
  );
}

function TriagePanel({ report, isBusy, run }: ReportActionsProps) {
  const [severity, setSeverity] = useState(report.severity);
  const [summary, setSummary] = useState(report.summary ?? "");

  return (
    <InboxSection title="Triage">
      <div role="radiogroup" aria-label="Severity" className="flex gap-2">
        {SEVERITIES.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={severity === value}
            className="feedback-choice capitalize"
            onClick={() => setSeverity(severity === value ? null : value)}
          >
            {value}
          </button>
        ))}
      </div>
      <Input
        id="triage-summary"
        label="Summary"
        maxLength={280}
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
      />
      <Button
        type="button"
        disabled={isBusy}
        onClick={() =>
          void run("Triage saved.", () => triageReport(report.id, severity, summary))
        }
      >
        {report.status === "open" ? "Mark Triaged" : "Save Triage"}
      </Button>
    </InboxSection>
  );
}

function ClosePanel({ report, isBusy, run }: ReportActionsProps) {
  const [note, setNote] = useState("");
  const [commit, setCommit] = useState("");
  const [duplicateOf, setDuplicateOf] = useState("");

  function close(resolution: FeedbackResolution) {
    void run(`Closed as ${RESOLUTION_LABELS[resolution].toLowerCase()}.`, () =>
      resolveReport(report.id, {
        resolution,
        reporterNote: note,
        fixedCommit: commit,
        duplicateOf: resolution === "duplicate" ? duplicateOf : undefined,
      }),
    );
  }

  return (
    <InboxSection title="Close">
      <div className="ds-field">
        <label htmlFor="close-note" className="ds-field__label">
          Note to the reporter (required for Fixed)
        </label>
        <textarea
          id="close-note"
          className="ds-input min-h-20 resize-y"
          maxLength={600}
          placeholder="One warm, plain sentence"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      <Input
        id="close-commit"
        label="Fix commit (optional)"
        maxLength={40}
        value={commit}
        onChange={(event) => setCommit(event.target.value)}
      />
      <Button type="button" disabled={isBusy || !note.trim()} onClick={() => close("fixed")}>
        Fixed
      </Button>

      <div className="space-y-2 border-t border-warm-gray pt-3">
        <div className="ds-field__label">Close as</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_CLOSES.map((resolution) => (
            <Button
              key={resolution}
              type="button"
              variant="secondary"
              disabled={isBusy}
              onClick={() => close(resolution)}
            >
              {RESOLUTION_LABELS[resolution]}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="ds-input min-w-0 flex-1"
            aria-label="Original report id"
            placeholder="Original report id"
            value={duplicateOf}
            onChange={(event) => setDuplicateOf(event.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={isBusy || !duplicateOf.trim()}
            onClick={() => close("duplicate")}
          >
            Duplicate
          </Button>
        </div>
      </div>
    </InboxSection>
  );
}

export function ReportActions(props: ReportActionsProps) {
  if (props.report.status === "resolved") return <ReopenPanel {...props} />;

  return (
    <>
      <TriagePanel {...props} />
      <ClosePanel {...props} />
    </>
  );
}

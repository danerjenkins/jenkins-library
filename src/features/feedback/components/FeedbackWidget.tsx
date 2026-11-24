import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Bug, CircleHelp, Lightbulb, MessageSquare, Pencil, X } from "lucide-react";
import { useAuth } from "../../../app/auth/useAuth";
import { Button } from "../../../ui/components/Button";
import { getActiveLibraryIdForRepos } from "../../libraries/activeLibraryState";
import { useUnreadFeedback } from "../hooks/useUnreadFeedback";
import { getFeedbackSessionId } from "../lib/buildContext";
import { primeCapture, takeCapture, type Capture } from "../lib/captureScreenshot";
import { onOpenFeedback } from "../lib/feedbackEvents";
import type { FeedbackKind } from "../lib/feedbackTypes";
import { renderMarkup, type Stroke } from "../lib/screenshotMarkup";
import { flushFeedbackQueue, submitFeedback, type SubmitOutcome } from "../lib/submitFeedback";
import { ScreenshotAnnotator } from "./ScreenshotAnnotator";
import "./FeedbackWidget.css";

const MAX_CHARS = 2000;
const COUNTER_THRESHOLD = 200;
const SENT_DISMISS_MS = 4000;

const KIND_OPTIONS = [
  { value: "bug", label: "Bug", Icon: Bug },
  { value: "confusing", label: "Confusing", Icon: CircleHelp },
  { value: "idea", label: "Idea", Icon: Lightbulb },
] as const;

const SENT_MESSAGES: Record<SubmitOutcome, string> = {
  sent: "Thanks! Your feedback is in.",
  queued: "You seem to be offline. We saved this and will send it later.",
  failed: "That didn't send. Please try again.",
};

type WidgetState = "launcher" | "panel" | "annotate" | "sent";

interface FeedbackWidgetProps {
  /** The widget sits outside the router so it survives route errors. */
  onViewMyFeedback: () => void;
}

export function FeedbackWidget({ onViewMyFeedback }: FeedbackWidgetProps) {
  const { session } = useAuth();
  const unreadCount = useUnreadFeedback();
  const [state, setState] = useState<WidgetState>("launcher");
  const [capture, setCapture] = useState<Capture | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [baseShot, setBaseShot] = useState<string | null>(null);
  const [markedShot, setMarkedShot] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<FeedbackKind | null>(null);
  const [outcome, setOutcome] = useState<SubmitOutcome>("sent");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);

  const open = useCallback(() => {
    const nextCapture = takeCapture();
    setCapture(nextCapture);
    setBaseShot(null);
    setMarkedShot(null);
    setStrokes([]);
    setIsCapturing(true);
    setState("panel");
    void nextCapture.screenshot.then((shot) => {
      setBaseShot(shot);
      setIsCapturing(false);
    });
  }, []);

  const collapse = useCallback(() => {
    setState("launcher");
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  const closeAnnotator = useCallback(() => setState("panel"), []);

  useEffect(() => {
    const isOpen = state === "panel" || state === "annotate";
    const openIfClosed = () => {
      if (!isOpen) open();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const isChord = (event.metaKey || event.ctrlKey) && event.shiftKey;
      if (isChord && event.key.toLowerCase() === "f") {
        event.preventDefault();
        openIfClosed();
      } else if (event.key === "Escape" && state === "annotate") {
        closeAnnotator();
      } else if (event.key === "Escape" && state === "panel") {
        collapse();
      }
    };

    const unsubscribe = onOpenFeedback(openIfClosed);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unsubscribe();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeAnnotator, collapse, open, state]);

  useEffect(() => {
    const flush = () => void flushFeedbackQueue();
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  useEffect(() => {
    if (state === "panel") textareaRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (state !== "sent") return;
    const timer = window.setTimeout(() => setState("launcher"), SENT_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [outcome, state]);

  const screenshot = markedShot ?? baseShot;
  const trimmed = description.trim();
  const canSend = trimmed.length > 0 || (includeScreenshot && screenshot !== null);
  const remaining = MAX_CHARS - description.length;

  async function handleAnnotated(nextStrokes: Stroke[]) {
    setState("panel");
    if (!baseShot) return;
    setStrokes(nextStrokes);
    setIncludeScreenshot(true);
    setMarkedShot(await renderMarkup(baseShot, nextStrokes).catch(() => baseShot));
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!capture || !canSend) return;

    const draft = { description, kind };
    const report = {
      kind: kind ?? "bug",
      expectation: trimmed,
      route: window.location.pathname.slice(0, 256),
      app_version: import.meta.env.VITE_APP_VERSION,
      app_commit: import.meta.env.VITE_APP_COMMIT,
      session_id: getFeedbackSessionId(),
      library_id: getActiveLibraryIdForRepos(),
      context: capture.context,
    };
    const pendingShot = includeScreenshot ? (markedShot ?? capture.screenshot) : null;

    // Optimistic: thank them now, and correct the message only if sending fails.
    setOutcome("sent");
    setState("sent");
    setDescription("");
    setKind(null);
    setIncludeScreenshot(true);

    const result = await submitFeedback({ ...report, screenshot: await pendingShot });
    if (result === "sent") return;
    setOutcome(result);
    setState((current) => (current === "launcher" ? "sent" : current));
    if (result === "failed") {
      setDescription((current) => current || draft.description);
      setKind((current) => current ?? draft.kind);
    }
  }

  return (
    <div className="feedback-widget" data-feedback-ignore="" data-state={state}>
      {state === "launcher" ? (
        <button
          ref={launcherRef}
          type="button"
          className="feedback-widget__launcher"
          aria-label={
            unreadCount > 0 ? `Feedback, ${unreadCount} new updates` : "Send feedback"
          }
          title="Send feedback (Ctrl+Shift+F)"
          onPointerDown={primeCapture}
          onClick={open}
        >
          <MessageSquare aria-hidden="true" size={18} />
          <span className="feedback-widget__launcher-label">Feedback</span>
          {unreadCount > 0 ? (
            <span className="feedback-widget__unread" aria-hidden="true">
              {unreadCount}
            </span>
          ) : null}
        </button>
      ) : null}

      {state === "sent" ? (
        <div className="feedback-widget__toast" role="status">
          {SENT_MESSAGES[outcome]}
        </div>
      ) : null}

      {state === "panel" ? (
        <form
          className="feedback-widget__panel"
          role="dialog"
          aria-labelledby="feedback-title"
          onSubmit={(event) => void handleSend(event)}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="feedback-title" className="feedback-widget__title">
              Feedback
            </h2>
            <button
              type="button"
              className="feedback-widget__icon-button"
              aria-label="Close feedback"
              onClick={collapse}
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>

          {unreadCount > 0 ? (
            <button
              type="button"
              className="feedback-widget__news"
              onClick={() => {
                collapse();
                onViewMyFeedback();
              }}
            >
              {unreadCount === 1
                ? "There's an update on something you sent"
                : `There are updates on ${unreadCount} things you sent`}
            </button>
          ) : null}

          <div className="space-y-2">
            <button
              type="button"
              className="feedback-widget__preview"
              aria-label="Draw on the screenshot"
              disabled={!baseShot}
              onClick={() => setState("annotate")}
            >
              {screenshot ? (
                <>
                  <img
                    src={screenshot}
                    alt="Screenshot of this page"
                    className={includeScreenshot ? "" : "opacity-40"}
                  />
                  <span className="feedback-widget__preview-hint">
                    <Pencil aria-hidden="true" size={12} />
                    {strokes.length > 0 ? "Edit drawing" : "Draw on it"}
                  </span>
                </>
              ) : (
                <span className="text-sm text-stone-600">
                  {isCapturing ? "Capturing this page…" : "No screenshot this time"}
                </span>
              )}
            </button>
            {screenshot || isCapturing ? (
              <label className="flex min-h-8 items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={includeScreenshot}
                  onChange={(event) => setIncludeScreenshot(event.target.checked)}
                />
                Include this screenshot
              </label>
            ) : null}
          </div>

          <div className="ds-field">
            <label htmlFor="feedback-description" className="ds-field__label">
              What should we fix or improve?
            </label>
            <textarea
              id="feedback-description"
              ref={textareaRef}
              className="ds-input min-h-24 resize-y text-base"
              value={description}
              maxLength={MAX_CHARS}
              placeholder="Tell us anything."
              onChange={(event) => setDescription(event.target.value)}
            />
            {remaining < COUNTER_THRESHOLD ? (
              <span className="text-right text-xs text-stone-600" aria-live="polite">
                {remaining} characters left
              </span>
            ) : null}
          </div>

          <div role="radiogroup" aria-label="What kind of feedback is it?" className="flex gap-2">
            {KIND_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={kind === value}
                className="feedback-choice"
                onClick={() => setKind(kind === value ? null : value)}
              >
                <Icon aria-hidden="true" size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            {session ? (
              <button
                type="button"
                className="feedback-widget__link"
                onClick={() => {
                  collapse();
                  onViewMyFeedback();
                }}
              >
                Your feedback
              </button>
            ) : (
              <span className="text-xs text-stone-600">Sign in first if you'd like a reply.</span>
            )}
            <Button type="submit" disabled={!canSend}>
              Send
            </Button>
          </div>
        </form>
      ) : null}

      {state === "annotate" && baseShot ? (
        <ScreenshotAnnotator
          base={baseShot}
          initialStrokes={strokes}
          onDone={(nextStrokes) => void handleAnnotated(nextStrokes)}
          onCancel={closeAnnotator}
        />
      ) : null}
    </div>
  );
}

import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import type { FeedbackBundle } from "./feedbackTypes";

const QUEUE_KEY = "jenkins-library:feedback-queue";
const QUEUE_LIMIT = 5;

function readQueue(): FeedbackBundle[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: FeedbackBundle[]): boolean {
  const recent = queue.slice(-QUEUE_LIMIT);
  // Screenshots can exceed the storage quota; the words matter more.
  for (const candidate of [recent, recent.map((item) => ({ ...item, screenshot: null }))]) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(candidate));
      return true;
    } catch {
      // Try again without screenshots.
    }
  }
  return false;
}

async function post(bundle: FeedbackBundle) {
  const { error } = await supabase.functions.invoke("feedback-report", { body: bundle });
  if (error) throw error;
}

/** The server refused the content itself, so sending it again cannot help. */
function isPermanent(error: unknown) {
  if (!(error instanceof FunctionsHttpError)) return false;
  const { status } = error.context as Response;
  return status === 400 || status === 413;
}

export type SubmitOutcome = "sent" | "queued" | "failed";

export async function submitFeedback(bundle: FeedbackBundle): Promise<SubmitOutcome> {
  try {
    await post(bundle);
    return "sent";
  } catch (error) {
    console.warn("Feedback submit failed:", error);
    if (isPermanent(error)) return "failed";
    return writeQueue([...readQueue(), bundle]) ? "queued" : "failed";
  }
}

let flushing = false;

/** Retry reports a flaky network held back. */
export async function flushFeedbackQueue() {
  if (flushing) return;
  flushing = true;
  try {
    for (const bundle of readQueue()) {
      try {
        await post(bundle);
      } catch (error) {
        if (!isPermanent(error)) continue;
      }
      // Drop each delivered report as it lands, so closing the tab cannot lose the rest.
      const delivered = bundle.context.captured_at;
      writeQueue(readQueue().filter((item) => item.context.captured_at !== delivered));
    }
  } finally {
    flushing = false;
  }
}

import type { BugReport, FeedbackKind, FeedbackResolution } from "./feedbackTypes";

export const KIND_LABELS: Record<FeedbackKind, string> = {
  bug: "Bug",
  confusing: "Confusing",
  idea: "Idea",
};

export const RESOLUTION_LABELS: Record<FeedbackResolution, string> = {
  fixed: "Fixed",
  noise: "Noise",
  duplicate: "Duplicate",
  wontfix: "Won't fix",
  by_design: "By design",
};

/** Reporter-safe status; never the internal open/triaged/resolved. */
export function reporterStatus({ status, resolution }: Pick<BugReport, "status" | "resolution">) {
  if (status === "open") return "Submitted";
  if (status === "triaged") return "Reviewing";
  return resolution === "fixed" ? "Fixed" : "Reviewed";
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 60 * 24 * 30) return `${Math.round(minutes / (60 * 24))}d ago`;
  return new Date(iso).toLocaleDateString();
}

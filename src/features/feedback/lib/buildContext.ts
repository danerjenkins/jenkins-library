import { readRings } from "./captureRings";
import type { FeedbackContext } from "./feedbackTypes";
import { scrub } from "./scrub";

const SESSION_KEY = "jenkins-library:feedback-session";
let memorySessionId: string | null = null;

export function getFeedbackSessionId(): string {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
  } catch {
    // Fall through to the in-memory id.
  }
  memorySessionId ??= crypto.randomUUID();
  try {
    sessionStorage.setItem(SESSION_KEY, memorySessionId);
  } catch {
    // Storage unavailable; the id lasts for this page load.
  }
  return memorySessionId;
}

function readPerformance(longTasks: number): FeedbackContext["perf"] {
  const perf: FeedbackContext["perf"] = { long_tasks: longTasks };
  const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  if (navigation) {
    perf.load_ms = Math.round(navigation.loadEventEnd);
    perf.ttfb_ms = Math.round(navigation.responseStart - navigation.requestStart);
    perf.dom_ms = Math.round(navigation.domContentLoadedEventEnd);
  }
  const { memory } = performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  };
  if (memory) {
    perf.heap_used_mb = Math.round(memory.usedJSHeapSize / 1048576);
    perf.heap_limit_mb = Math.round(memory.jsHeapSizeLimit / 1048576);
  }
  const { connection } = navigator as Navigator & {
    connection?: { effectiveType?: string; downlink?: number; rtt?: number };
  };
  if (connection) {
    perf.connection = {
      type: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    };
  }
  return perf;
}

export function buildContext(): FeedbackContext {
  const { lastElement, longTasks, ...rings } = readRings();
  return {
    session_id: getFeedbackSessionId(),
    captured_at: new Date().toISOString(),
    url: scrub(`${location.pathname}${location.search}`, 300),
    title: scrub(document.title, 160),
    user_agent: navigator.userAgent,
    viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
    color_scheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
    scroll: { x: Math.round(window.scrollX), y: Math.round(window.scrollY) },
    last_element: lastElement,
    perf: readPerformance(longTasks),
    ...rings,
  };
}

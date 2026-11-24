// Passive instrumentation for feedback reports. Keeps only the latest entries of each ring.
import type { Breadcrumb, ConsoleEntry, ErrorEntry, NetworkEntry } from "./feedbackTypes";
import { scrub, scrubStack } from "./scrub";

const RING_CAP = 25;
/** Our own intake calls would only add noise to a report. */
const IGNORED_URL_PART = "/functions/v1/feedback-report";

const breadcrumbs: Breadcrumb[] = [];
const consoleEntries: ConsoleEntry[] = [];
const network: NetworkEntry[] = [];
const errors: ErrorEntry[] = [];
let lastElement: { selector: string; text: string } | null = null;
let longTasks = 0;
let installed = false;

function push<T>(ring: T[], entry: T) {
  ring.push(entry);
  if (ring.length > RING_CAP) ring.shift();
}

export function readRings() {
  return {
    breadcrumbs: [...breadcrumbs],
    console: [...consoleEntries],
    network: [...network],
    errors: [...errors],
    lastElement,
    longTasks,
  };
}

export function recordNavigation(path: string) {
  const detail = scrub(path, 160);
  const previous = breadcrumbs.at(-1);
  if (previous?.type === "nav" && previous.detail === detail) return;
  push(breadcrumbs, { t: Date.now(), type: "nav", detail });
}

export function recordError(error: unknown, source: string) {
  push(errors, {
    t: Date.now(),
    message: scrub(error instanceof Error ? error.message : error, 300),
    stack: scrubStack(error instanceof Error ? error.stack : undefined),
    source: scrub(source, 300),
  });
}

function selectorFor(element: Element): string {
  const tag = element.tagName.toLowerCase();
  if (element.id) return `${tag}#${element.id}`;
  const label = element.getAttribute("aria-label");
  if (label) return `${tag}[aria-label="${label.slice(0, 40)}"]`;
  const classes = [...element.classList]
    .filter((name) => /^[a-z][\w-]{0,29}$/i.test(name))
    .slice(0, 2);
  return [tag, ...classes].join(".");
}

/** Visible label only. Form fields are skipped because their text can hold typed values. */
function visibleText(element: Element): string {
  if (element.matches("input, textarea, select, [contenteditable]")) return "";
  return scrub((element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60), 60);
}

function eventElement(event: Event): Element | null {
  const target = event.target instanceof Element ? event.target : null;
  return target && !target.closest("[data-feedback-ignore]") ? target : null;
}

function recordRequest(method: string, url: string, started: number, status: number, ok: boolean) {
  if (url.startsWith("data:") || url.includes(IGNORED_URL_PART)) return;
  push(network, {
    t: Date.now(),
    method: method.toUpperCase(),
    url: scrub(url, 300),
    status,
    ms: Math.round(performance.now() - started),
    ok,
  });
}

function installConsole() {
  for (const level of ["log", "info", "warn", "error"] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      try {
        push(consoleEntries, {
          t: Date.now(),
          level,
          text: scrub(args.map((arg) => scrub(arg, 300)).join(" "), 300),
        });
      } catch {
        // Capture must never break logging.
      }
      original(...args);
    };
  }
}

function installFetch() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const started = performance.now();
    try {
      const response = await originalFetch(input, init);
      recordRequest(method, url, started, response.status, response.ok);
      return response;
    } catch (error) {
      recordRequest(method, url, started, 0, false);
      throw error;
    }
  };
}

function installXhr() {
  const originalOpen = XMLHttpRequest.prototype.open as (...args: unknown[]) => void;
  XMLHttpRequest.prototype.open = function open(
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    const started = performance.now();
    this.addEventListener(
      "loadend",
      () => {
        const ok = this.status >= 200 && this.status < 400;
        recordRequest(method, String(url), started, this.status, ok);
      },
      { once: true },
    );
    originalOpen.call(this, method, url, ...rest);
  };
}

export function installCapture() {
  if (installed) return;
  installed = true;

  installConsole();
  installFetch();
  installXhr();

  window.addEventListener("error", (event) => {
    recordError(
      event.error ?? event.message,
      `${event.filename}:${event.lineno}:${event.colno}`,
    );
  });
  window.addEventListener("unhandledrejection", (event) => {
    recordError(event.reason, "unhandledrejection");
  });

  document.addEventListener(
    "click",
    (event) => {
      const target = eventElement(event);
      if (!target) return;
      const element =
        target.closest("button, a, input, select, textarea, label, [role='button']") ?? target;
      const selector = scrub(selectorFor(element), 120);
      const text = visibleText(element);
      lastElement = { selector, text };
      push(breadcrumbs, {
        t: Date.now(),
        type: "click",
        detail: scrub(text ? `${selector} "${text}"` : selector, 160),
      });
    },
    true,
  );
  document.addEventListener(
    "change",
    (event) => {
      const target = eventElement(event);
      if (!target) return;
      // Which field changed, never its value.
      push(breadcrumbs, { t: Date.now(), type: "input", detail: scrub(selectorFor(target), 160) });
    },
    true,
  );

  try {
    new PerformanceObserver((list) => {
      longTasks += list.getEntries().length;
    }).observe({ type: "longtask", buffered: true });
  } catch {
    // Not supported in this browser.
  }
}

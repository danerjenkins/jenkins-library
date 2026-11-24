// modern-screenshot is imported on demand; primeCapture() warms it on pointerdown.
import { buildContext } from "./buildContext";
import type { FeedbackContext } from "./feedbackTypes";
import { loadFontCss } from "./screenshotFonts";

const MAX_DATA_URL_LENGTH = 4 * 1024 * 1024;
const PRIME_TTL_MS = 5000;
const FETCH_TIMEOUT_MS = 3000;
const CAPTURE_TIMEOUT_MS = 12000;

export interface Capture {
  /** Read before the screenshot runs, because inlining covers fills the network ring. */
  context: FeedbackContext;
  screenshot: Promise<string | null>;
}

let primed: { capture: Capture; at: number } | null = null;

/**
 * Shelves hold hundreds of cards, so cloning the whole page takes most of a minute.
 * Drop what is off screen, but keep the empty box of anything above or to the left so
 * the layout of what remains does not move.
 */
function findHiddenNodes(): Set<Node> {
  const hidden = new Set<Node>();
  const { innerWidth, innerHeight } = window;

  const visit = (parent: Element) => {
    for (const child of parent.children) {
      if (child.matches("[data-feedback-ignore]")) {
        hidden.add(child);
        continue;
      }

      const { bottom, height, left, right, top, width } = child.getBoundingClientRect();
      const hasBox = width > 0 && height > 0;
      const isAfter = top > innerHeight || left >= innerWidth;
      const isBefore = bottom < 0 || right <= 0;

      if (!hasBox || !(isAfter || isBefore)) {
        visit(child);
      } else if (isAfter || getComputedStyle(child).position === "fixed") {
        hidden.add(child);
      } else {
        child.childNodes.forEach((node) => hidden.add(node));
      }
    }
  };

  visit(document.body);
  return hidden;
}

async function renderScreenshot(): Promise<string | null> {
  try {
    const [{ createContext, domToPng }, cssText] = await Promise.all([
      import("modern-screenshot"),
      loadFontCss(),
    ]);
    const hidden = findHiddenNodes();
    const { innerHeight, innerWidth, scrollX, scrollY } = window;

    const context = await createContext(document.body, {
      scale: 1,
      width: innerWidth,
      height: innerHeight,
      backgroundColor: "#f3ecdf",
      drawImageInterval: 30,
      font: cssText ? { cssText } : false,
      // Setup waits for every lazy image, and off-screen ones never load.
      timeout: 1,
      style: {
        margin: "0",
        transform: `translate(${-scrollX}px, ${-scrollY}px)`,
        transformOrigin: "0 0",
      },
      filter: (node) => !hidden.has(node),
      // The body is shifted by the scroll offset, so shift pinned elements back.
      onCloneEachNode: (node) => {
        if (!(node instanceof HTMLElement)) return;
        const { position, transform } = node.style;
        if (position === "fixed" || node.classList.contains("app-header")) {
          const own = transform && transform !== "none" ? transform : "";
          node.style.transform = `translate(${scrollX}px, ${scrollY}px) ${own}`;
        }
      },
    });
    context.timeout = FETCH_TIMEOUT_MS;

    const dataUrl = await domToPng(context);
    return dataUrl.length > MAX_DATA_URL_LENGTH ? null : dataUrl;
  } catch (error) {
    console.warn("Feedback screenshot failed:", error);
    return null;
  }
}

function startCapture(): Capture {
  const timeout = new Promise<null>((resolve) => setTimeout(resolve, CAPTURE_TIMEOUT_MS, null));
  return {
    context: buildContext(),
    screenshot: Promise.race([renderScreenshot(), timeout]),
  };
}

function freshCapture() {
  return primed && Date.now() - primed.at < PRIME_TTL_MS ? primed.capture : null;
}

export function primeCapture() {
  if (!freshCapture()) primed = { capture: startCapture(), at: Date.now() };
}

/** Use the capture primed moments ago, or start one now. */
export function takeCapture(): Capture {
  const capture = freshCapture() ?? startCapture();
  primed = null;
  return capture;
}

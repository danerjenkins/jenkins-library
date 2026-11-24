let fontCss: Promise<string> | null = null;

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read a font."));
    reader.readAsDataURL(blob);
  });
}

async function buildFontCss(): Promise<string> {
  const link = document.querySelector<HTMLLinkElement>('link[href*="fonts.googleapis.com/css2"]');
  if (!link) return "";

  // The service worker may hold an opaque copy of the page's own URL, which fetch cannot read.
  const response = await fetch(link.href.replace("display=swap", "display=block"));
  const css = await response.text();
  // Google lists one block per alphabet; the latin ones cover this app.
  const latin = [...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*{[^}]*})/g)].map(([, rule]) => rule);

  const urls = new Set(latin.flatMap((rule) => rule.match(/https:[^)"']+/g) ?? []));
  const dataUrls = new Map(
    await Promise.all([...urls].map(async (url) => [url, await toDataUrl(url)] as const)),
  );
  return latin
    .map((rule) => rule.replace(/https:[^)"']+/g, (url) => dataUrls.get(url) ?? url))
    .join("\n");
}

/** The page fonts as inline CSS. Without them, captured text wraps and clips differently. */
export function loadFontCss(): Promise<string> {
  fontCss ??= buildFontCss().catch(() => {
    fontCss = null;
    return "";
  });
  return fontCss;
}

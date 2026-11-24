// Every captured string runs through here before it can leave the browser.
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
const SECRET_PARAM_PATTERN =
  /([?&#](?:token|apikey|api_key|access_token|refresh_token|id_token|key|secret|password|code|session)=)[^&#\s]*/gi;
const BEARER_PATTERN = /\bBearer\s+[^\s"',;]+/gi;
const SENSITIVE_PAIR_PATTERN =
  /((?:authorization|api[-_]?key|token|secret|password|bearer|cookie|session)["']?\s*[:=]\s*["']?)(?!Bearer\b)[^\s"',;}&]+/gi;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+(?:@|%40)[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const LONG_TOKEN_PATTERN = /[A-Za-z0-9_-]{40,}/g;

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

export function scrub(value: unknown, max: number): string {
  // Bound the work first; the margin keeps a secret at the cut from surviving.
  const cleaned = toText(value)
    .slice(0, max + 4000)
    .replace(JWT_PATTERN, "[redacted-jwt]")
    .replace(SECRET_PARAM_PATTERN, "$1[redacted]")
    .replace(BEARER_PATTERN, "Bearer [redacted]")
    .replace(SENSITIVE_PAIR_PATTERN, "$1[redacted]")
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(LONG_TOKEN_PATTERN, "[redacted]");

  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

/** The message line plus the first six frames. */
export function scrubStack(stack: string | undefined): string | undefined {
  return stack ? scrub(stack.split("\n").slice(0, 7).join("\n"), 2000) : undefined;
}

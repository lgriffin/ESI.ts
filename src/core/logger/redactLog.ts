import { sanitizeUrl } from '../util/error';
import type { LogContext } from './ILogger';

/** Base for resolving a relative path such as `/characters/1/?token=x`. */
const RELATIVE_BASE = 'https://relative.invalid';

/** Characters that wrap a URL in prose: quotes and brackets. */
const WRAPPERS = new Set([
  '"',
  "'",
  '`',
  '<',
  '>',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
]);

const ABSOLUTE = /^[a-z][a-z\d+.-]*:\/\//i;

/**
 * Redact the sensitive query parameters of one URL-like token through
 * `sanitizeUrl`. The token comes back unchanged when it carries none, so
 * text that merely contains a `?` keeps its exact wording.
 */
function redactToken(token: string): string {
  const absolute = ABSOLUTE.test(token);
  let href: string;
  try {
    href = absolute
      ? new URL(token).toString()
      : new URL(token, RELATIVE_BASE).toString();
  } catch {
    return token;
  }
  const safe = sanitizeUrl(href) ?? href;
  if (safe === href) return token;
  return absolute ? safe : safe.slice(RELATIVE_BASE.length);
}

const isSchemeChar = (c: string): boolean => /^[a-z\d+.-]$/i.test(c);

/**
 * Where the URL starts inside a word such as `url='https://…'` or
 * `endpoint=/characters/1/?token=…`: the scheme of an absolute URL, else the
 * first `/` before the query, else the start of the word.
 */
function urlStart(word: string): number {
  const schemeEnd = word.indexOf('://');
  if (schemeEnd > 0) {
    let start = schemeEnd;
    while (start > 0 && isSchemeChar(word.charAt(start - 1))) start--;
    return start;
  }
  const slash = word.indexOf('/');
  return slash >= 0 && slash < word.indexOf('?') ? slash : 0;
}

/**
 * Redact one whitespace-delimited word, leaving any prefix (`url=`) and the
 * quotes or brackets around the URL in place.
 */
function redactWord(word: string): string {
  if (!word.includes('?')) return word;
  let end = word.length;
  while (end > 0 && WRAPPERS.has(word.charAt(end - 1))) end--;
  let start = urlStart(word.slice(0, end));
  while (start < end && WRAPPERS.has(word.charAt(start))) start++;
  const url = word.slice(start, end);
  if (!url.includes('?')) return word;
  return word.slice(0, start) + redactToken(url) + word.slice(end);
}

/** Redact every URL embedded in a piece of log text. */
export function redactLogText(text: string): string {
  if (!text.includes('?')) return text;
  return text.split(/(\s+)/).map(redactWord).join('');
}

/**
 * Redact the log context: every top-level string value (a `url`, an
 * `endpoint`, a path) passes through the same URL redaction as the message.
 * Returns `undefined` for a missing or empty context so a logger never
 * receives `{}`.
 */
export function redactLogContext(
  context: LogContext | undefined,
): LogContext | undefined {
  if (!context) return undefined;
  const entries = Object.entries(context);
  if (entries.length === 0) return undefined;
  let changed = false;
  const redacted = entries.map(([key, value]): [string, unknown] => {
    if (typeof value !== 'string') return [key, value];
    const safe = redactLogText(value);
    if (safe !== value) changed = true;
    return [key, safe];
  });
  return changed ? Object.fromEntries(redacted) : context;
}

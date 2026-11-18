import { SENSITIVE_QUERY_PATTERN, isSensitiveQueryParam } from '../util/error';
import type { ILogger, LogContext, LoggerLevel } from './ILogger';

/**
 * One `name=value` pair, in a URL query or a form body: the boundary before
 * it (the same set as `NAME_BOUNDARY` in ../util/error), the name as written,
 * and the value up to the next separator, whitespace, or character that ends
 * a URL in prose (`?`, quotes, brackets, a comma or semicolon). Neither the
 * name nor the value runs over a boundary, so a pair that is not sensitive
 * never swallows one that is. A sensitive value is then extended over any
 * `?` that does not start a pair of its own (`valueEnd`).
 */
const PAIR =
  /(^|[?&\s"'`(\[{,;])([^=&#?\s"'`()[\]{},;<>]+)=([^&#?\s,;"'`<>()[\]{}]*)/g;

/** A run of the characters a pair's name may hold (`PAIR`'s name set). */
const NAME_RUN = /[^=&#?\s,;"'`<>()[\]{}]*/y;

/** A run of the characters a pair's value may hold (`PAIR`'s value set). */
const VALUE_RUN = /[^&#?\s,;"'`<>()[\]{}]*/y;

/**
 * One JSON string member, `"name": "value"`, with the text between the two
 * strings kept as written. The name and the value may hold escaped
 * characters, so `"refresh\u005ftoken"` is read as `refresh_token`. A name
 * never holds a quote, even an escaped one, so the scan for a name stops at
 * the next quote and stays linear in the length of the line.
 */
const JSON_MEMBER = /"((?:[^"\\]|\\[^"])+)"(\s*:\s*)"((?:[^"\\]|\\.)*)"/g;

/** The value `sanitizeUrl` writes for a redacted parameter, URL-encoded. */
const REDACTED = '%5BREDACTED%5D';

/** The value a redacted JSON member carries. */
const REDACTED_JSON = '[REDACTED]';

/**
 * Redact every credential in a piece of log text: the sensitive parameters of
 * a URL query or a form body (`grant_type=refresh_token&refresh_token=…`) and
 * the sensitive string members of JSON (`"refresh_token": "…"`), matching the
 * names `sanitizeUrl` redacts. It works on the text itself rather than parsing
 * it, so URLs next to punctuation, relative and protocol-relative paths, URLs
 * `new URL` rejects and truncated bodies are all covered, and everything else
 * in the line keeps its exact wording.
 */
export function redactLogText(text: string): string {
  if (!SENSITIVE_QUERY_PATTERN.test(text)) return text;
  const json = text.replace(
    JSON_MEMBER,
    (member: string, name: string, colon: string, value: string) =>
      value !== '' && isSensitiveQueryParam(jsonName(name))
        ? `"${name}"${colon}"${REDACTED_JSON}"`
        : member,
  );
  return redactPairs(json);
}

/**
 * Redact the value of every sensitive `name=value` pair in the text. A value
 * runs on over a `?` unless a `name=` follows it, so `token=ab?cd` is
 * redacted whole while `next=/a/?token=x` still finds `token=x`.
 */
function redactPairs(text: string): string {
  let out = '';
  let last = 0;
  PAIR.lastIndex = 0;
  for (let m = PAIR.exec(text); m !== null; m = PAIR.exec(text)) {
    const [pair, boundary, name] = m as unknown as [string, string, string];
    if (!isSensitiveQueryParam(name)) continue;
    const start = m.index + boundary.length + name.length + 1;
    const end = valueEnd(text, m.index + pair.length);
    const value = text.slice(start, end);
    if (value === '') continue;
    out += `${text.slice(last, m.index)}${boundary}${name}=${REDACTED}${danglingEscape(value)}`;
    last = end;
    PAIR.lastIndex = end;
  }
  return out + text.slice(last);
}

/**
 * Where a sensitive value ends, given where `PAIR` stopped it: each `?` that
 * is not followed by a `name=` belongs to the value, with the characters
 * after it. Every character is read once, so this stays linear.
 */
function valueEnd(text: string, from: number): number {
  let end = from;
  while (text.charAt(end) === '?') {
    const nameEnd = runEnd(NAME_RUN, text, end + 1);
    if (nameEnd > end + 1 && text.charAt(nameEnd) === '=') break;
    end = runEnd(VALUE_RUN, text, nameEnd);
  }
  return end;
}

/**
 * Where a sticky run of characters that starts at `from` ends. The run may be
 * empty, so it always matches.
 */
function runEnd(run: RegExp, text: string, from: number): number {
  run.lastIndex = from;
  return from + (run.exec(text) as RegExpExecArray)[0].length;
}

/** A JSON member name with its escapes decoded, or as written if invalid. */
function jsonName(name: string): string {
  try {
    return JSON.parse(`"${name}"`) as string;
  } catch {
    return name;
  }
}

/**
 * The backslash a redacted value must keep: a pair inside a JSON string ends
 * at an escaped quote, so its value ends in the backslash that escapes it.
 * An odd run of trailing backslashes holds that escape; an even run is
 * complete escapes and belongs to the value.
 */
function danglingEscape(value: string): string {
  let odd = false;
  for (let i = value.length - 1; value.charAt(i) === '\\'; i--) odd = !odd;
  return odd ? '\\' : '';
}

/**
 * Redact the log context: every top-level string value (a `url`, an
 * `endpoint`, a path, a response body) passes through the same redaction as
 * the message.
 * Returns `undefined` for a missing or empty context so a logger never
 * receives `{}`.
 */
export function redactLogContext(
  context: LogContext | undefined,
): LogContext | undefined {
  if (!context) return undefined;
  const keys = Object.keys(context);
  if (keys.length === 0) return undefined;
  for (const key of keys) {
    if (mayCarrySecret(context[key])) return redactValues(context, keys);
  }
  return context;
}

/** The prefilter `redactLogText` applies, inlined for the hot path. */
function mayCarrySecret(value: unknown): value is string {
  return typeof value === 'string' && SENSITIVE_QUERY_PATTERN.test(value);
}

function redactValues(
  context: LogContext,
  keys: readonly string[],
): LogContext {
  const redacted: LogContext = {};
  for (const key of keys) {
    const value = context[key];
    redacted[key] = mayCarrySecret(value) ? redactLogText(value) : value;
  }
  return redacted;
}

/**
 * A view of a logger that skips disabled levels and redacts each line the
 * way the pipeline's log helpers do, for code that holds a logger directly
 * rather than logging through a client.
 */
export function redactingLogger(logger: ILogger): ILogger {
  const at =
    (level: LoggerLevel) =>
    (message: string, context?: LogContext): void => {
      if (logger.isLevelEnabled?.(level) === false) return;
      const safe = redactLogContext(context);
      if (safe === undefined) logger[level](redactLogText(message));
      else logger[level](redactLogText(message), safe);
    };
  return {
    fatal: at('fatal'),
    error: at('error'),
    warn: at('warn'),
    info: at('info'),
    debug: at('debug'),
    trace: at('trace'),
  };
}

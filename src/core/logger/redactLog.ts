import { SENSITIVE_QUERY_PATTERN, isSensitiveQueryParam } from '../util/error';
import type { ILogger, LogContext, LoggerLevel } from './ILogger';

/**
 * One `name=value` pair, in a URL query or a form body: the boundary before
 * it (the same set as `NAME_BOUNDARY` in ../util/error), the name as written,
 * and the value up to the next separator, whitespace, or character that ends
 * a URL in prose (`?`, quotes, brackets, a comma or semicolon). Neither the
 * name nor the value runs over a boundary, so a pair that is not sensitive
 * never swallows one that is.
 */
const PAIR =
  /(^|[?&\s"'`(\[{,;])([^=&#?\s"'`()[\]{},;<>]+)=([^&#?\s,;"'`<>()[\]{}]*)/g;

/**
 * One JSON string member, `"name": "value"`, with the text between the two
 * strings kept as written. The value may hold escaped characters.
 */
const JSON_MEMBER = /"([^"\\]+)"(\s*:\s*)"((?:[^"\\]|\\.)*)"/g;

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
  return text
    .replace(
      JSON_MEMBER,
      (member: string, name: string, colon: string, value: string) =>
        value !== '' && isSensitiveQueryParam(name)
          ? `"${name}"${colon}"${REDACTED_JSON}"`
          : member,
    )
    .replace(
      PAIR,
      (pair: string, boundary: string, name: string, value: string) =>
        value !== '' && isSensitiveQueryParam(name)
          ? `${boundary}${name}=${REDACTED}`
          : pair,
    );
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

/**
 * What 0058-logging.feature configures and reads: a logger that records every
 * line it receives, and a request interceptor that puts a query parameter on
 * every request URL, the way an application passing a credential in the query
 * would.
 */
import type {
  ILogger,
  LogContext,
  LoggerLevel,
} from '../../../src/core/logger/ILogger';
import type { RequestInterceptor } from '../../../src/core/middleware/Middleware';

export interface LoggedLine {
  level: LoggerLevel;
  message: string;
  context: LogContext | undefined;
}

export interface RecordingLogger extends ILogger {
  readonly lines: LoggedLine[];
}

export function recordingLogger(): RecordingLogger {
  const lines: LoggedLine[] = [];
  const at =
    (level: LoggerLevel) =>
    (message: string, context?: LogContext): void => {
      lines.push({ level, message, context });
    };
  return {
    lines,
    fatal: at('fatal'),
    error: at('error'),
    warn: at('warn'),
    info: at('info'),
    debug: at('debug'),
    trace: at('trace'),
  };
}

/** Appends `name=value` to the query of every request URL. */
export function addQueryParameter(
  name: string,
  value: string,
): RequestInterceptor {
  return (context) => {
    const url = new URL(context.url);
    url.searchParams.set(name, value);
    return { ...context, url: url.toString() };
  };
}

/** The message prefix the pipeline logs each outgoing request under. */
const REQUEST_LINE = 'Hitting endpoint: ';

/** The URLs of the outgoing-request lines the logger received. */
export function loggedRequestUrls(logger: RecordingLogger): URL[] {
  return logger.lines
    .filter((line) => line.message.startsWith(REQUEST_LINE))
    .map((line) => new URL(line.message.slice(REQUEST_LINE.length)));
}

/** The key and value pairs of a Map, a Set (no keys) or any other object. */
function entriesOf(value: object): Array<[unknown, unknown]> {
  if (value instanceof Map) return [...value.entries()];
  if (value instanceof Set) return [...value].map((v) => [undefined, v]);
  return Object.entries(value);
}

/**
 * Every string reachable from a logged value: the value itself, or every
 * string inside it however deeply nested, through arrays, plain objects,
 * Maps, Sets and Errors (message, stack and cause included). Keys are
 * included too, since a header name can carry the value it names.
 */
export function stringsIn(
  value: unknown,
  seen = new WeakSet<object>(),
): string[] {
  if (typeof value === 'string') return [value];
  if (value === null || typeof value !== 'object') return [];
  if (seen.has(value)) return [];
  seen.add(value);
  const out: string[] = [];
  if (value instanceof Error) {
    out.push(value.message, ...(value.stack ? [value.stack] : []));
    out.push(...stringsIn(value.cause, seen));
  }
  const entries = entriesOf(value);
  for (const [key, inner] of entries) {
    out.push(...stringsIn(key, seen), ...stringsIn(inner, seen));
  }
  return out;
}

/** Every message the logger received and every string anywhere in its context. */
export function loggedText(logger: RecordingLogger): string[] {
  return logger.lines.flatMap((line) => [
    line.message,
    ...stringsIn(line.context),
  ]);
}

/** The console methods `createConsoleLogger` writes to. */
export type ConsoleStream = 'log' | 'warn' | 'error';

/** The stream names the console scenarios use, by the method behind each. */
export const CONSOLE_STREAMS: Readonly<Record<string, ConsoleStream>> = {
  'standard output': 'log',
  'the warning stream': 'warn',
  'the error stream': 'error',
};

export type ConsoleCapture = Record<ConsoleStream, string[]>;

/**
 * Records what reaches console.log, console.warn and console.error instead of
 * printing it, until `restore` runs. The scenario registers `restore` as a
 * cleanup, so the console is back before the next scenario starts.
 */
export function captureConsole(): {
  lines: ConsoleCapture;
  restore: () => void;
} {
  const lines: ConsoleCapture = { log: [], warn: [], error: [] };
  const record =
    (stream: ConsoleStream) =>
    (...args: unknown[]): void => {
      lines[stream].push(args.map(String).join(' '));
    };
  const logSpy = jest.spyOn(console, 'log').mockImplementation(record('log'));
  const warnSpy = jest
    .spyOn(console, 'warn')
    .mockImplementation(record('warn'));
  const errorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(record('error'));
  return {
    lines,
    restore: () => {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    },
  };
}

/** Every line the console received, on any stream. */
export function allConsoleLines(lines: ConsoleCapture): string[] {
  return [...lines.log, ...lines.warn, ...lines.error];
}

/**
 * Sets ESI_LOG_LEVEL (or deletes it, for `undefined`) and returns the cleanup
 * that puts back whatever the process had before.
 */
export function withLogLevelEnv(value: string | undefined): () => void {
  const had = Object.hasOwn(process.env, 'ESI_LOG_LEVEL');
  const previous = process.env.ESI_LOG_LEVEL;
  if (value === undefined) delete process.env.ESI_LOG_LEVEL;
  else process.env.ESI_LOG_LEVEL = value;
  return () => {
    if (had) process.env.ESI_LOG_LEVEL = previous;
    else delete process.env.ESI_LOG_LEVEL;
  };
}

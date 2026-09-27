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

/** Every message and every string context value the logger received. */
export function loggedText(logger: RecordingLogger): string[] {
  return logger.lines.flatMap((line) => [
    line.message,
    ...Object.values(line.context ?? {}).filter(
      (value): value is string => typeof value === 'string',
    ),
  ]);
}

/**
 * Structured context attached to a log event (e.g. endpoint, status,
 * requestId, durationMs). Logged as structured fields when the sink
 * supports them (pino), or appended as `[k=v]` tokens when it doesn't.
 */
export interface LogContext {
  [key: string]: unknown;
}

/** The six levels an `ILogger` accepts. */
export type LoggerLevel =
  'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface ILogger {
  fatal(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  trace(message: string, context?: LogContext): void;
  /**
   * Optional. When it returns `false` for a level, the library skips that
   * line before building it, so a disabled level costs nothing, including
   * the URL redaction every line otherwise goes through. Loggers without it
   * receive every line and filter it themselves.
   */
  isLevelEnabled?(level: LoggerLevel): boolean;
}

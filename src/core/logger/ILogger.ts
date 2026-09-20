/**
 * Structured context attached to a log event (e.g. endpoint, status,
 * requestId, durationMs). Logged as structured fields when the sink
 * supports them (pino), or appended as `[k=v]` tokens when it doesn't.
 */
export interface LogContext {
  [key: string]: unknown;
}

export interface ILogger {
  fatal(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  trace(message: string, context?: LogContext): void;
}

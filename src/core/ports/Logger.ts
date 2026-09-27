/**
 * Where the pipeline writes its log events. The package's pino-backed logger
 * implements it, and so does any object with these six methods.
 */

/** Structured fields attached to one log event (endpoint, status, and so on). */
export interface LogFields {
  [key: string]: unknown;
}

export interface Logger {
  fatal(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  debug(message: string, fields?: LogFields): void;
  trace(message: string, fields?: LogFields): void;
}

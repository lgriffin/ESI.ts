import type { LogLevel } from './DefaultLogger';
import type { ILogger, LogContext, LoggerLevel } from './ILogger';

const SEVERITY: Readonly<Record<LoggerLevel | 'silent', number>> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: Infinity,
};

const isLevel = (value: unknown): value is LoggerLevel | 'silent' =>
  typeof value === 'string' && Object.hasOwn(SEVERITY, value);

function resolveLevel(level: unknown): LoggerLevel | 'silent' {
  if (isLevel(level)) return level;
  const fromEnv =
    typeof process === 'undefined' ? undefined : process.env.ESI_LOG_LEVEL;
  return isLevel(fromEnv) ? fromEnv : 'warn';
}

function formatValue(value: unknown): string {
  if (value instanceof Error) return value.message;
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    case 'undefined':
      return 'undefined';
    case 'symbol':
      return value.toString();
    case 'function':
      return `[function ${value.name || 'anonymous'}]`;
    default:
      try {
        return JSON.stringify(value);
      } catch {
        return '[unserialisable]';
      }
  }
}

/** `message [k=v] [k=v]`, the plain-text form `LogContext` promises. */
function formatLine(message: string, context?: LogContext): string {
  if (!context) return message;
  const tokens = Object.entries(context).map(
    ([key, value]) => `[${key}=${formatValue(value)}]`,
  );
  return tokens.length ? `${message} ${tokens.join(' ')}` : message;
}

/**
 * An `ILogger` that writes human-readable lines to the console, for scripts,
 * command-line tools and the examples, where pino's JSON lines get in the
 * way. Level resolution matches `createDefaultLogger`: the `level` argument,
 * then `ESI_LOG_LEVEL`, then `'warn'`; `'silent'` writes nothing, and an
 * unknown value falls back rather than throwing, since a logger must not
 * throw.
 *
 * `info` lines are written as they are; every other level is prefixed with
 * its name (`warn: ...`). `info` and below go to `console.log`, `warn` to
 * `console.warn`, and `error` and `fatal` to `console.error`, so a failure
 * lands on standard error. Context is appended as `[key=value]` tokens: an
 * `Error` shows its message, a string as is, anything else as JSON.
 *
 * ```ts
 * const log = createConsoleLogger('info'); // the program's own output
 * const client = new EsiClient({ logger: createConsoleLogger() });
 * log.info(`Players online: ${(await client.status.getStatus()).players}`);
 * ```
 */
export function createConsoleLogger(level?: LogLevel | 'silent'): ILogger {
  const threshold = SEVERITY[resolveLevel(level)];
  const enabled = (at: LoggerLevel): boolean => SEVERITY[at] >= threshold;
  const write =
    (at: LoggerLevel, sink: (line: string) => void) =>
    (message: string, context?: LogContext): void => {
      if (!enabled(at)) return;
      const line = formatLine(message, context);
      sink(at === 'info' ? line : `${at}: ${line}`);
    };
  /* eslint-disable no-console -- the one sanctioned console sink */
  const out = (line: string): void => console.log(line);
  const warn = (line: string): void => console.warn(line);
  const err = (line: string): void => console.error(line);
  /* eslint-enable no-console */
  return {
    fatal: write('fatal', err),
    error: write('error', err),
    warn: write('warn', warn),
    info: write('info', out),
    debug: write('debug', out),
    trace: write('trace', out),
    isLevelEnabled: enabled,
  };
}

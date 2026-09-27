import type { ApiClient } from '../ApiClient';
import type { LogContext } from './ILogger';
import { redactLogContext, redactLogText } from './redactLog';
import { resolveLogger } from './resolveLogger';

type Level = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

type Emit = (
  client: ApiClient | null | undefined,
  message: string,
  context?: LogContext,
) => void;

/**
 * The logger boundary for the pipeline: every line resolves the per-client
 * logger and has the sensitive query parameters of any URL in its message or
 * top-level string context values redacted through `sanitizeUrl`, so no call
 * site has to remember to sanitise.
 */
const emit =
  (level: Level): Emit =>
  (client, message, context) => {
    resolveLogger(client)[level](
      redactLogText(message),
      redactLogContext(context),
    );
  };

export const logFatal: Emit = emit('fatal');
export const logError: Emit = emit('error');
export const logWarn: Emit = emit('warn');
export const logInfo: Emit = emit('info');
export const logDebug: Emit = emit('debug');
export const logTrace: Emit = emit('trace');

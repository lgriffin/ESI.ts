import type { ILogger } from './ILogger';
import { defaultLogger } from './DefaultLogger';
import { getLogger } from './loggerUtil';

/**
 * Resolve the logger for a given API client: per-client logger first,
 * global (via `setLogger`) if a non-default one was installed, then the
 * built-in pino default.
 */
export function resolveLogger(
  client: { getLogger?: () => ILogger | null } | null | undefined,
): ILogger {
  const perClient = client?.getLogger?.();
  if (perClient) return perClient;
  const global = getLogger();
  if (global !== defaultLogger) return global;
  return defaultLogger;
}

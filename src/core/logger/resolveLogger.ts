import type { ILogger } from './ILogger';
import { getLogger } from './loggerUtil';

/**
 * Resolve the logger for a given API client: per-client logger first, then
 * the global one — a logger installed with `setLogger`, or the built-in pino
 * default when none was.
 */
export function resolveLogger(
  client: { getLogger?: () => ILogger | null } | null | undefined,
): ILogger {
  return client?.getLogger?.() ?? getLogger();
}

import { createDefaultLogger, defaultLogger } from './DefaultLogger';
import type { ILogger } from './ILogger';

export { createDefaultLogger, defaultLogger };
export type { LogLevel } from './DefaultLogger';

const globalLogger: ILogger = createDefaultLogger();

/**
 * @deprecated The global logger singleton was removed in favor of per-client
 * loggers (`EsiClientConfig.logger`). Use `createDefaultLogger(level?)` for a
 * pino-backed logger, or pass any `ILogger` via `EsiClientConfig.logger`.
 * `setLogger()` from `loggerUtil` still exists for global fallback control.
 */
export default globalLogger;

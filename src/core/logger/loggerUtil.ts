import type { ILogger, LogContext } from './ILogger';
import { defaultLogger } from './DefaultLogger';
import { redactLogContext, redactLogText } from './redactLog';

export type { ILogger, LogContext } from './ILogger';

/**
 * Global logger fallback.
 *
 * The request pipeline reads the *per-client* logger first and only falls
 * back to this global when a client has none (e.g. the raw factory
 * `EsiApiFactory` clients, or unit tests that call pipeline modules
 * directly). Production apps can rely on the per-client logger from
 * `EsiClientConfig.logger`; this global exists for backwards compatibility
 * and for apps that want one shared logger across all clients.
 */
let activeLogger: ILogger = defaultLogger;

export const setLogger = (customLogger: ILogger): void => {
  activeLogger = customLogger;
};

export const getLogger = (): ILogger => activeLogger;

const ctx = (context?: LogContext): LogContext | undefined =>
  redactLogContext(context);

export const logFatal = (message: string, context?: LogContext): void => {
  activeLogger.fatal(redactLogText(message), ctx(context));
};

export const logError = (message: string, context?: LogContext): void => {
  activeLogger.error(redactLogText(message), ctx(context));
};

export const logWarn = (message: string, context?: LogContext): void => {
  activeLogger.warn(redactLogText(message), ctx(context));
};

export const logInfo = (message: string, context?: LogContext): void => {
  activeLogger.info(redactLogText(message), ctx(context));
};

export const logDebug = (message: string, context?: LogContext): void => {
  activeLogger.debug(redactLogText(message), ctx(context));
};

export const logTrace = (message: string, context?: LogContext): void => {
  activeLogger.trace(redactLogText(message), ctx(context));
};

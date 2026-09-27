import type { ILogger, LogContext, LoggerLevel } from './ILogger';
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

const emit =
  (level: LoggerLevel) =>
  (message: string, context?: LogContext): void => {
    if (activeLogger.isLevelEnabled?.(level) === false) return;
    activeLogger[level](redactLogText(message), redactLogContext(context));
  };

export const logFatal: (message: string, context?: LogContext) => void =
  emit('fatal');

export const logError: (message: string, context?: LogContext) => void =
  emit('error');

export const logWarn: (message: string, context?: LogContext) => void =
  emit('warn');

export const logInfo: (message: string, context?: LogContext) => void =
  emit('info');

export const logDebug: (message: string, context?: LogContext) => void =
  emit('debug');

export const logTrace: (message: string, context?: LogContext) => void =
  emit('trace');

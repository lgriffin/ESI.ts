import type { ApiClient } from '../ApiClient';
import type { LogContext } from './ILogger';
import { resolveLogger } from './resolveLogger';

type Level = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

type Emit = (
  client: ApiClient | null | undefined,
  message: string,
  context?: LogContext,
) => void;

const emit =
  (level: Level): Emit =>
  (client, message, context) => {
    resolveLogger(client)[level](
      message,
      context && Object.keys(context).length > 0 ? context : undefined,
    );
  };

export const logFatal: Emit = emit('fatal');
export const logError: Emit = emit('error');
export const logWarn: Emit = emit('warn');
export const logInfo: Emit = emit('info');
export const logDebug: Emit = emit('debug');
export const logTrace: Emit = emit('trace');

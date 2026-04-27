import logger from './logger';
import { ILogger } from './ILogger';

export type { ILogger } from './ILogger';

let activeLogger: ILogger = logger;

export const setLogger = (customLogger: ILogger): void => {
  activeLogger = customLogger;
};

export const getLogger = (): ILogger => activeLogger;

export const logInfo = (message: string) => {
  activeLogger.info(message);
};

export const logError = (message: string) => {
  activeLogger.error(message);
};

export const logWarn = (message: string) => {
  activeLogger.warn(message);
};

export const logDebug = (message: string) => {
  activeLogger.debug(message);
};

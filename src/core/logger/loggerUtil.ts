import logger from './logger';

export const logInfo = (message: string) => {
  logger.info(message);
};

export const logError = (message: string) => {
  logger.error(message);
};

export const logWarn = (message: string) => {
  logger.warn(message);
};

export const logDebug = (message: string) => {
  logger.debug(message);
};

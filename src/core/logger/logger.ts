import pino from 'pino';
import { ILogger } from './ILogger';

const pinoLogger = pino({ level: process.env.ESI_LOG_LEVEL || 'warn' });

const logger: ILogger = {
  info: (msg: string) => {
    pinoLogger.info(msg);
  },
  warn: (msg: string) => {
    pinoLogger.warn(msg);
  },
  error: (msg: string) => {
    pinoLogger.error(msg);
  },
  debug: (msg: string) => {
    pinoLogger.debug(msg);
  },
};

export default logger;

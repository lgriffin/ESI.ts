import type { ILogger } from './ILogger';

const noop = () => {};

const noopLogger: ILogger = {
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
};

export function createNoopLogger(): ILogger {
  return noopLogger;
}

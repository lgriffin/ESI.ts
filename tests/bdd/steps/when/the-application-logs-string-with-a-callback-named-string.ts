import { When } from '../../support/steps';

When(
  'the application logs {string} with a callback named {string}',
  function (message: string, name: string) {
    const callback = (): void => {};
    Object.defineProperty(callback, 'name', { value: name });
    this.values.consoleLogger.info(message, { callback });
  },
);

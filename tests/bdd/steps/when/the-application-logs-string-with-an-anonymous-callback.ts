import { When } from '../../support/steps';

When(
  'the application logs {string} with an anonymous callback',
  function (message: string) {
    const callback = (): void => {};
    Object.defineProperty(callback, 'name', { value: '' });
    this.values.consoleLogger.info(message, { callback });
  },
);

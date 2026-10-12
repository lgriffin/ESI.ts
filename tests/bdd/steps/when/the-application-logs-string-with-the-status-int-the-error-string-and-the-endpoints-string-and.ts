import { When } from '../../support/steps';

When(
  'the application logs {string} with the status {int}, the error {string} and the endpoints {string} and {string}',
  function (message, status, cause, first, second) {
    this.values.consoleLogger.error(message, {
      status,
      cause: new Error(cause),
      endpoints: [first, second],
    });
  },
);

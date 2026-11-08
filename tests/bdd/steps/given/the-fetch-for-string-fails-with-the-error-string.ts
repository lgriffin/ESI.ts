import { Given } from '../../support/steps';

Given(
  'the fetch for {string} fails with the error {string}',
  function (key: string, message: string) {
    (this.values.failures as Map<string, unknown>).set(key, new Error(message));
  },
);

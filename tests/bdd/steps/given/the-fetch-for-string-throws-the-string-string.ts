import { Given } from '../../support/steps';

Given(
  'the fetch for {string} throws the string {string}',
  function (key: string, value: string) {
    (this.values.failures as Map<string, unknown>).set(key, value);
  },
);

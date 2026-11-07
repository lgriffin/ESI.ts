import { Then } from '../../support/steps';

Then(
  "the result's field {string} shall be {string}",
  function (field: string, value: string) {
    expect((this.result as Record<string, unknown>)[field]).toBe(value);
  },
);

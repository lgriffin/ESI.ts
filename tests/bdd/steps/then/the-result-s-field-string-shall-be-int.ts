import { Then } from '../../support/steps';

Then(
  "the result's field {string} shall be {int}",
  function (field: string, value: number) {
    expect((this.result as Record<string, unknown>)[field]).toBe(value);
  },
);

import { Then } from '../../support/steps';

Then(
  'the request for {string} shall have been sent {int} time',
  function (key: string, times: number) {
    expect((this.values.executions as Record<string, number>)[key]).toBe(times);
  },
);

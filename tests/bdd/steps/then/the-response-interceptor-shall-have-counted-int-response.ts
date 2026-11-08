import { Then } from '../../support/steps';

Then(
  'the response interceptor shall have counted {int} response',
  function (count: number) {
    expect(this.values.responses).toBe(count);
  },
);

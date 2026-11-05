import { Then } from '../../support/steps';

Then(
  'exactly the error guards {string} shall return true',
  function (guards: string) {
    expect(this.result).toEqual(guards.split(' '));
  },
);

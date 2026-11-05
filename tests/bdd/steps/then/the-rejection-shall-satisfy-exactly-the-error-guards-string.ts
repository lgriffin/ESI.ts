import { guardsSatisfiedBy } from '../../support/error-guards';
import { Then } from '../../support/steps';

Then(
  'the rejection shall satisfy exactly the error guards {string}',
  function (guards: string) {
    expect(this.result).toBeUndefined();
    expect(guardsSatisfiedBy(this.error)).toEqual(guards.split(' '));
  },
);

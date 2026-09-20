import { dogmaFixtures, dogmaMatches } from '../../support/dogma';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return an array of effect IDs', function () {
  expect(lastRequest().url.pathname).toMatch(dogmaMatches.effectIndex);
  expect(this.result).toEqual(dogmaFixtures.effectIds());
  this.result.forEach((id: unknown) => {
    expect(typeof id).toBe('number');
  });
});

import { dogmaFixtures, dogmaMatches } from '../../support/dogma';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return an array of attribute IDs', function () {
  expect(lastRequest().method).toBe('GET');
  expect(lastRequest().url.pathname).toMatch(dogmaMatches.attributeIndex);
  expect(this.result).toEqual(dogmaFixtures.attributeIds());
  this.result.forEach((id: unknown) => {
    expect(typeof id).toBe('number');
  });
});

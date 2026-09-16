import { warPaths } from '../../support/wars';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return an array of war IDs', function () {
  expect(lastRequest().method).toBe('GET');
  expect(lastRequest().url.pathname).toBe(warPaths.list);
  expect(this.result).toEqual([700005, 700004, 700003, 700002, 700001]);
  this.result.forEach((warId: number) => {
    expect(typeof warId).toBe('number');
    expect(warId).toBeGreaterThan(0);
  });
});

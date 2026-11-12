import { statusFixtures } from '../../support/status';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return current status information', function () {
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toMatch(/\/status\/?$/);
  // Status is public: no bearer token is sent.
  expect(request.headers['authorization']).toBeUndefined();
  expect(this.result).toEqual(statusFixtures.status(32000));
});

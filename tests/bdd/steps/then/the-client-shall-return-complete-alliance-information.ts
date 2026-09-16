import { GOONSWARM_ALLIANCE_ID } from '../../support/alliance';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return complete alliance information', function () {
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toMatch(
    new RegExp(`/alliances/${GOONSWARM_ALLIANCE_ID}/$`),
  );
  expect(this.result.name).toBe('Goonswarm Federation');
  expect(this.result.ticker).toBe('CONDI');
  expect(this.result.creator_id).toBe(1689391488);
  expect(this.result.creator_corporation_id).toBe(1344654522);
  expect(this.result.date_founded).toBe('2010-06-01T00:00:00Z');
});

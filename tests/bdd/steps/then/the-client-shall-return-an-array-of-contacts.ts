import { GOONSWARM_ALLIANCE_ID } from '../../support/alliance';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return an array of contacts', function () {
  const request = lastRequest();
  expect(request.url.pathname).toMatch(
    new RegExp(`/alliances/${GOONSWARM_ALLIANCE_ID}/contacts$`),
  );
  expect(request.headers.authorization).toBe('Bearer bdd-access-token');
  expect(this.result).toEqual([
    {
      contact_id: 1689391488,
      contact_type: 'character',
      standing: 10.0,
      label_ids: [1, 2],
    },
    {
      contact_id: 1344654522,
      contact_type: 'corporation',
      standing: 5.0,
      label_ids: [3],
    },
  ]);
});

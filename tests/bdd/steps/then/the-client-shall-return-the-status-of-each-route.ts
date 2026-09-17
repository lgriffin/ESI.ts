import { metaPaths } from '../../support/meta';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the status of each route', function () {
  expect(lastRequest().url.pathname).toBe(metaPaths.status);
  expect(
    this.result.routes.map((r: any) => [r.method, r.path, r.status]),
  ).toEqual([
    ['GET', '/alliances', 'OK'],
    ['GET', '/markets/{region_id}/orders', 'Degraded'],
  ]);
});

import { metaFixtures, metaPaths } from '../../support/meta';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a valid OpenAPI JSON document', function () {
  expect(lastRequest().method).toBe('GET');
  expect(lastRequest().url.pathname).toBe(metaPaths.json);
  expect(this.result.openapi).toBe('3.1.0');
  expect(this.result.info).toEqual({
    title: 'EVE Stable Infrastructure (ESI) - tranquility',
    version: '2025-12-16',
  });
  expect(Object.keys(this.result.paths)).toEqual(['/alliances', '/status']);
  expect(this.result.components).toEqual(metaFixtures.jsonSpec().components);
});

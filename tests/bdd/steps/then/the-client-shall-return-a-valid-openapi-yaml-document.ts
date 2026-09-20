import { metaFixtures, metaPaths } from '../../support/meta';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a valid OpenAPI YAML document', function () {
  expect(sentRequests()).toHaveLength(1);
  expect(lastRequest().method).toBe('GET');
  expect(lastRequest().url.pathname).toBe(metaPaths.yaml);
  expect(lastRequest().headers.accept).toContain('yaml');
  // Returned verbatim: byte-identical to what ESI sent, not parsed.
  expect(typeof this.result).toBe('string');
  expect(this.result).toBe(metaFixtures.yamlSpec());
});

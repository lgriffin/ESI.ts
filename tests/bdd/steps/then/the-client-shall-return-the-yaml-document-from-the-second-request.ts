import { metaFixtures, metaPaths } from '../../support/meta';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return the YAML document from the second request',
  function () {
    const requests = sentRequests();
    expect(requests).toHaveLength(2);
    expect(requests.map((r) => r.url.pathname)).toEqual([
      metaPaths.yaml,
      metaPaths.yaml,
    ]);
    expect(this.result).toBe(metaFixtures.yamlSpec());
  },
);

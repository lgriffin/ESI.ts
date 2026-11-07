import { surfaceOf } from '../../support/client-construction';
import type { CustomEsiClient } from '../../../../src/EsiClientBuilder';
import { Then } from '../../support/steps';

Then(
  "the CustomEsiClient's safe-mode views read twice shall be the same object holding a status client",
  function () {
    const client = surfaceOf(this).built as CustomEsiClient;
    const first = client.withSafeMode();
    expect(first.status).toBeDefined();
    expect(client.withSafeMode()).toBe(first);
  },
);

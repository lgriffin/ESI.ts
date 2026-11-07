import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import { Then } from '../../support/steps';

Then(
  "the EsiClient's diagnostics read twice shall be the same object",
  function () {
    const client = surfaceOf(this).built as EsiClient;
    const first = client.diagnostics;
    expect(first).toBeDefined();
    expect(client.diagnostics).toBe(first);
  },
);

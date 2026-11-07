import { surfaceOf } from '../../support/client-construction';
import type { CustomEsiClient } from '../../../../src/EsiClientBuilder';
import { Then } from '../../support/steps';

Then(
  "the CustomEsiClient's cache shall hold {int} entries",
  function (count: number) {
    expect(
      (surfaceOf(this).built as CustomEsiClient).getCacheStats()?.totalEntries,
    ).toBe(count);
  },
);

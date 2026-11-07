import { surfaceOf } from '../../support/client-construction';
import type { CustomEsiClient } from '../../../../src/EsiClientBuilder';
import { When } from '../../support/steps';

When(
  "the CustomEsiClient's cache limit is set to {int} entries",
  function (maxEntries: number) {
    (surfaceOf(this).built as CustomEsiClient).updateCacheConfig({
      maxEntries,
    });
  },
);

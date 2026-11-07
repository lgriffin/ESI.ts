import { surfaceOf } from '../../support/client-construction';
import type { CustomEsiClient } from '../../../../src/EsiClientBuilder';
import { When } from '../../support/steps';

When("the CustomEsiClient's cache is cleared", function () {
  (surfaceOf(this).built as CustomEsiClient).clearCache();
});

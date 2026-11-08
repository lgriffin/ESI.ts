import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import { When } from '../../support/steps';

When("the EsiClient's token provider is removed", function () {
  (surfaceOf(this).built as EsiClient).setTokenProvider(undefined);
});

import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import { When } from '../../support/steps';

When("the EsiClient's access token is replaced", function () {
  (surfaceOf(this).built as EsiClient).setAccessToken('replaced-token');
});

import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import { Given } from '../../support/steps';

Given("the EsiClient's status client is noted", function () {
  this.values.statusBefore = (surfaceOf(this).built as EsiClient).status;
});

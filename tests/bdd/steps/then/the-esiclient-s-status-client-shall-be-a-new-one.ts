import { surfaceOf } from '../../support/client-construction';
import type { EsiClient } from '../../../../src/EsiClient';
import { Then } from '../../support/steps';

Then("the EsiClient's status client shall be a new one", function () {
  const after = (surfaceOf(this).built as EsiClient).status;
  expect(after).toBeDefined();
  expect(after).not.toBe(this.values.statusBefore);
});

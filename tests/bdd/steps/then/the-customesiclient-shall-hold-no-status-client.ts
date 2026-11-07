import { surfaceOf } from '../../support/client-construction';
import type { CustomEsiClient } from '../../../../src/EsiClientBuilder';
import { Then } from '../../support/steps';

Then('the CustomEsiClient shall hold no status client', function () {
  expect(
    (surfaceOf(this).built as CustomEsiClient).getClient('status'),
  ).toBeUndefined();
});

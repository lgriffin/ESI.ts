import { NAMES_LOOKUP_IDS } from '../../support/mock-transport';
import { captureOutcome } from '../../support/outcome';
import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When('the public view resolves the names of two IDs', async function () {
  await captureOutcome(this, () =>
    runtimeOf(this).public.universe.names.post(NAMES_LOOKUP_IDS),
  );
});

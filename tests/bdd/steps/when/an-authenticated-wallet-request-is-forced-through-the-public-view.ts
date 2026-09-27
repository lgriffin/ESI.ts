import type { ScopeTree } from '../../../../src/client';
import { CHARACTER_ID, runtimeOf } from '../../support/shared-runtime';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'an authenticated wallet request is forced through the public view',
  async function () {
    // The cast is the whole point: the type forbids this call.
    const forced = runtimeOf(this).public as unknown as ScopeTree;
    await captureOutcome(this, () =>
      forced.character(CHARACTER_ID).wallet.get(),
    );
  },
);

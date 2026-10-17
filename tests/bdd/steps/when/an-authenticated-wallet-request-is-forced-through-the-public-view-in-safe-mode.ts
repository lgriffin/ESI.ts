import type { SafeView, ScopeTree } from '../../../../src/client';
import { captureOutcome } from '../../support/outcome';
import { CHARACTER_ID, runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'an authenticated wallet request is forced through the public view in safe mode',
  async function () {
    // The cast is the whole point: the type forbids this call.
    const forced = runtimeOf(this).withSafeMode()
      .public as unknown as SafeView<ScopeTree>;
    await captureOutcome(this, () =>
      forced.character(CHARACTER_ID).wallet.get(),
    );
  },
);

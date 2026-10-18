import type { CustomEsiClient } from '../../../../src/EsiClientBuilder';
import { publicCustomClientOf } from '../../support/custom-client';
import { captureOutcome } from '../../support/outcome';
import { CHARACTER_ID } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'an authenticated wallet request is forced through the public custom client',
  async function () {
    // The cast is the whole point: the public type leaves this method out.
    const forced = publicCustomClientOf(this) as unknown as CustomEsiClient;
    await captureOutcome(this, () =>
      forced.wallet!.getCharacterWallet(CHARACTER_ID),
    );
  },
);

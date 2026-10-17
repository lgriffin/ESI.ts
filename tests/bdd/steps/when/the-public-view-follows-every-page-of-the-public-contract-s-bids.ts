import { captureOutcome } from '../../support/outcome';
import {
  collect,
  PUBLIC_CONTRACT_ID,
  runtimeOf,
} from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "the public view follows every page of the public contract's bids",
  async function () {
    await captureOutcome(this, () =>
      collect(
        runtimeOf(this).public.contracts.public.bids(PUBLIC_CONTRACT_ID).get(),
      ),
    );
  },
);

import { CORPORATION_ID } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "each character's view requests the corporation wallets",
  async function () {
    this.result = [
      await this.views.first!.corporation(CORPORATION_ID).wallets.get(),
      await this.views.second!.corporation(CORPORATION_ID).wallets.get(),
    ];
  },
);

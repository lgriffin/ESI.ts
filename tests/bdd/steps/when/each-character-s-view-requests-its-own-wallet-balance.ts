import { CHARACTER_ID, OTHER_CHARACTER_ID } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "each character's view requests its own wallet balance",
  async function () {
    this.values.first = await this.views
      .first!.character(CHARACTER_ID)
      .wallet.get();
    try {
      this.values.second = await this.views
        .second!.character(OTHER_CHARACTER_ID)
        .wallet.get();
    } catch (err) {
      this.values.secondError = err;
    }
  },
);

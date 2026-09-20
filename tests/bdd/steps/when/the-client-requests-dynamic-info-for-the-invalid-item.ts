import { UNKNOWN_DYNAMIC_ITEM } from '../../support/dogma';
import { When } from '../../support/steps';

When(
  'the client requests dynamic info for the invalid item',
  async function () {
    try {
      await this.client.dogma.getDynamicItemInfo(
        UNKNOWN_DYNAMIC_ITEM.typeId,
        UNKNOWN_DYNAMIC_ITEM.itemId,
      );
    } catch (error) {
      this.error = error;
    }
  },
);

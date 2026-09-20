import { MUTATED_ITEM } from '../../support/dogma';
import { When } from '../../support/steps';

When('the client requests its dynamic dogma info', async function () {
  this.result = await this.client.dogma.getDynamicItemInfo(
    MUTATED_ITEM.typeId,
    MUTATED_ITEM.itemId,
  );
});

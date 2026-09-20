import { POWER_OUTPUT_ATTRIBUTE_ID } from '../../support/dogma';
import { When } from '../../support/steps';

When('the client requests attribute details', async function () {
  this.result = await this.client.dogma.getAttributeById(
    POWER_OUTPUT_ATTRIBUTE_ID,
  );
});

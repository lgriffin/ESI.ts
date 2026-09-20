import { LOW_POWER_EFFECT_ID } from '../../support/dogma';
import { When } from '../../support/steps';

When('the client requests effect details', async function () {
  this.result = await this.client.dogma.getEffectById(LOW_POWER_EFFECT_ID);
});

import { CRIMSON_FURY_SKINR_ID } from '../../support/cosmetics';
import { When } from '../../support/steps';

When('the client requests SKINR attributes', async function () {
  this.result = await this.client.cosmetics.getSkinr(CRIMSON_FURY_SKINR_ID);
});

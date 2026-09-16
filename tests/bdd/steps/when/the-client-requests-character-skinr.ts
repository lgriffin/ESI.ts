import { SKINR_CHARACTER_ID } from '../../support/cosmetics';
import { When } from '../../support/steps';

When('the client requests character SKINR', async function () {
  this.result =
    await this.client.cosmetics.getCharacterSkinr(SKINR_CHARACTER_ID);
});

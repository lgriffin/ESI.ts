import { SKINR_CHARACTER_ID } from '../../support/cosmetics';
import { When } from '../../support/steps';

When('the client requests SKINR components', async function () {
  this.result =
    await this.client.cosmetics.getCharacterSkinrComponents(SKINR_CHARACTER_ID);
});

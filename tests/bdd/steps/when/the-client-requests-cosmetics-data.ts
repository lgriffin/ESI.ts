import { SKINR_CHARACTER_ID } from '../../support/cosmetics';
import { When } from '../../support/steps';

When('the client requests cosmetics data', async function () {
  try {
    await this.client.cosmetics.getCharacterSkinr(SKINR_CHARACTER_ID);
  } catch (e) {
    this.error = e;
  }
});

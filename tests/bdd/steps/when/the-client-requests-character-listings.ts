import { LISTING_CHARACTER_ID } from '../../support/paragon-hub';
import { When } from '../../support/steps';

When('the client requests character listings', async function () {
  this.result =
    await this.client.paragonHub.getCharacterListings(LISTING_CHARACTER_ID);
});

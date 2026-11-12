import { TARGETED_ALLIANCE_ID } from '../../support/paragon-hub';
import { When } from '../../support/steps';

When('the client requests alliance listings', async function () {
  this.result =
    await this.client.paragonHub.getAllianceListings(TARGETED_ALLIANCE_ID);
});

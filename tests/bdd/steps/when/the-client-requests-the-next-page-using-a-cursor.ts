import { PAGE_TWO_CURSOR } from '../../support/paragon-hub';
import { When } from '../../support/steps';

When('the client requests the next page using a cursor', async function () {
  this.result = await this.client.paragonHub.getPublicListings(PAGE_TWO_CURSOR);
});

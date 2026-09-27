import { When } from '../../support/steps';

When("the character's view requests the server status", async function () {
  this.result = await this.views.character!.status.get();
});

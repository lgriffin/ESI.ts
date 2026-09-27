import { When } from '../../support/steps';

When('the client requests the changelog', async function () {
  this.result = await this.client.meta.getChangelog();
});

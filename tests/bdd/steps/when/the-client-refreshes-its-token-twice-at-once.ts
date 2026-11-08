import { apiClientOf } from '../../support/pipeline-parts';
import { When } from '../../support/steps';

When('the client refreshes its token twice at once', async function () {
  const client = apiClientOf(this);
  this.result = await Promise.all([
    client.refreshToken(),
    client.refreshToken(),
  ]);
});

import { settle } from '../../support/pipeline-edges';
import { When } from '../../support/steps';

When('the client requests the server status twice', async function () {
  const status = this.client.status;
  this.values.outcomes = [
    await settle(() => status.getStatus()),
    await settle(() => status.getStatus()),
  ];
});

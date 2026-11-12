import { When } from '../../support/steps';

When('the client checks the status multiple times', async function () {
  this.result = [];
  for (let i = 0; i < 3; i++) {
    this.result.push(await this.client.status.getStatus());
  }
});

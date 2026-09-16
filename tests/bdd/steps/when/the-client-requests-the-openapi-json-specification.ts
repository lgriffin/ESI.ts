import { When } from '../../support/steps';

When('the client requests the OpenAPI JSON specification', async function () {
  this.result = await this.client.meta.getOpenApiJson();
});

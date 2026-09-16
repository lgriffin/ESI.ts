import { When } from '../../support/steps';

When('the client requests the OpenAPI specification', async function () {
  try {
    await this.client.meta.getOpenApiJson();
  } catch (e) {
    this.error = e;
  }
});

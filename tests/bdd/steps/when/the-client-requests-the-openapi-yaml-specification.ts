import { When } from '../../support/steps';

When('the client requests the OpenAPI YAML specification', async function () {
  this.result = await this.client.meta.getOpenApiYaml();
});

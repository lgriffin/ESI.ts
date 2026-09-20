import { When } from '../../support/steps';

When('the client retrieves both formats', async function () {
  const [json, yaml] = await Promise.all([
    this.client.meta.getOpenApiJson(),
    this.client.meta.getOpenApiYaml(),
  ]);
  this.result = { json, yaml };
});

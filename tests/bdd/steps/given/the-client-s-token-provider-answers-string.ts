import { apiClientOf } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given("the client's token provider answers {string}", function (token: string) {
  this.values.providerCalls = 0;
  apiClientOf(this).setTokenProvider(async () => {
    this.values.providerCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 1));
    return token;
  });
});

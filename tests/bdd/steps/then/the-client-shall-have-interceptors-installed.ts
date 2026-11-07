import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then('the client shall have interceptors installed', function () {
  expect(apiClientOf(this).getMiddleware().hasInterceptors()).toBe(true);
});

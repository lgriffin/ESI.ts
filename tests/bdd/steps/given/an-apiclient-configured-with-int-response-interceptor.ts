import { useConfiguredClient } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given(
  'an ApiClient configured with {int} response interceptor',
  function (count: number) {
    useConfiguredClient(this, {
      responseInterceptors: Array.from({ length: count }, () => (r) => r),
    });
  },
);

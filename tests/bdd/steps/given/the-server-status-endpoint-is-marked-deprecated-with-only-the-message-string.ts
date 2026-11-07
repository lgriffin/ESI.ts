import type { DeprecationInfo } from '../../../../src/core/endpoints/EndpointDefinition';
import { statusEndpoints } from '../../../../src/core/endpoints/statusEndpoints';
import { Given } from '../../support/steps';

Given(
  'the server status endpoint is marked deprecated with only the message {string}',
  function (message: string) {
    const def = statusEndpoints.getStatus as { deprecated?: DeprecationInfo };
    def.deprecated = { message } as DeprecationInfo;
    this.cleanups.push(() => {
      delete def.deprecated;
    });
  },
);

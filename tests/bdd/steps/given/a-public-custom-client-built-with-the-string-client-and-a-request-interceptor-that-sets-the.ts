import { buildPublicCustomClient } from '../../support/custom-client';
import { settingHeader } from '../../support/interceptors';
import { Given } from '../../support/steps';

Given(
  'a public custom client built with the {string} client and a request interceptor that sets the header {string} to {string}',
  function (name: string, header: string, value: string) {
    buildPublicCustomClient(this, [name], {
      config: { requestInterceptors: [settingHeader(header, value)] },
    });
  },
);

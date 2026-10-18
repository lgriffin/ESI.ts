import {
  addBearerInterceptor,
  buildPublicCustomClient,
} from '../../support/custom-client';
import { Given } from '../../support/steps';

Given(
  'a public custom client built with the {string} client and a request interceptor that adds a bearer',
  function (name: string) {
    buildPublicCustomClient(this, [name], {
      config: { requestInterceptors: [addBearerInterceptor] },
    });
  },
);

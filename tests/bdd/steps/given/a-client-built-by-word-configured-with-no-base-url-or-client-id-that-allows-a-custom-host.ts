import { buildSurface, type Surface } from '../../support/client-construction';
import { Given } from '../../support/steps';

Given(
  'a client built by {word} configured with no base URL or client ID that allows a custom host',
  function (surface: string) {
    buildSurface(this, surface as Surface, {
      baseUrl: undefined,
      clientId: undefined,
      unsafeAllowCustomHost: true,
    });
  },
);

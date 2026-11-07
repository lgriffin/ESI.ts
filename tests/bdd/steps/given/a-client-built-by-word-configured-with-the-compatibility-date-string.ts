import { buildSurface, type Surface } from '../../support/client-construction';
import { Given } from '../../support/steps';

Given(
  'a client built by {word} configured with the compatibility date {string}',
  function (surface: string, compatibilityDate: string) {
    buildSurface(this, surface as Surface, { compatibilityDate });
  },
);

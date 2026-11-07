import { buildSurface, type Surface } from '../../support/client-construction';
import { Given } from '../../support/steps';

Given(
  'a client built by {word} configured with the language {string}',
  function (surface: string, language: string) {
    buildSurface(this, surface as Surface, { language });
  },
);

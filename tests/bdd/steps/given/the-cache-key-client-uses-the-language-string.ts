import type { ApiClient } from '../../../../src/core/ApiClient';
import { Given } from '../../support/steps';

Given(
  'the cache key client uses the language {string}',
  function (language: string) {
    (this.values.keyClient as ApiClient).setLanguage(language);
  },
);

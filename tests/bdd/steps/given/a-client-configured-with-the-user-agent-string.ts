import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'a client configured with the user agent {string}',
  function (userAgent: string) {
    this.client = createSeamClient({ userAgent });
  },
);

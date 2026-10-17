import { markStatusEndpointDeprecated } from '../../support/custom-client';
import { Given } from '../../support/steps';

Given(
  'the server status endpoint is marked deprecated in favour of the route status',
  function () {
    this.cleanups.push(markStatusEndpointDeprecated());
  },
);

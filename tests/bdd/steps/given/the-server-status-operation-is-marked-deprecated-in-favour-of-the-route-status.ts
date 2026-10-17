import { markStatusDeprecated } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'the server status operation is marked deprecated in favour of the route status',
  function () {
    this.cleanups.push(markStatusDeprecated());
  },
);

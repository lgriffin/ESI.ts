import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI accepts the deletion of contacts', function () {
  queueResponse({ match: /\/contacts\/?(\?|$)/, status: 204 });
});

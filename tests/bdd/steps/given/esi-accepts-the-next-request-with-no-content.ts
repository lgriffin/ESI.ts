import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI accepts the next request with no content', function () {
  queueResponse({ status: 204 });
});

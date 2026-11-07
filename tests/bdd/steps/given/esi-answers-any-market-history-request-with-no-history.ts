import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI answers any market history request with no history', function () {
  queueResponse({ match: '/history/', body: [] });
});

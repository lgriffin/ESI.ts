import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI lists two wars', function () {
  queueResponse({ match: /\/wars\/?(\?|$)/, body: [699, 698] });
});

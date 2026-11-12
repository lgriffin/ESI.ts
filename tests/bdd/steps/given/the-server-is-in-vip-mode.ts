import { queueStatus } from '../../support/status';
import { Given } from '../../support/steps';

Given('the server is in VIP mode', function () {
  queueStatus(50, true);
});

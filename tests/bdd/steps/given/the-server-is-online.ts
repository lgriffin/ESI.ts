import { queueStatus } from '../../support/status';
import { Given } from '../../support/steps';

Given('the server is online', function () {
  queueStatus(28000);
});

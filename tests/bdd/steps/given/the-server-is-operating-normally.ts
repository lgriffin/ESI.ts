import { queueStatus } from '../../support/status';
import { Given } from '../../support/steps';

Given('the server is operating normally', function () {
  queueStatus(32000);
});

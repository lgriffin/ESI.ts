import { queueStatus } from '../../support/status';
import { Given } from '../../support/steps';

Given('the Tranquility server is online', function () {
  queueStatus(32000);
});

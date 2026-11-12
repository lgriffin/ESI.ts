import { queueStatus } from '../../support/status';
import { Given } from '../../support/steps';

Given('the server is online with a typical player count', function () {
  queueStatus(21874);
});

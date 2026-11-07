import { queueRevokeAnswer } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given('SSO accepts the next revocation', function () {
  queueRevokeAnswer();
});

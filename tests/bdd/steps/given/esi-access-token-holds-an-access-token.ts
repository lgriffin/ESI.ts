import { withAccessTokenEnv } from '../../support/custom-client';
import { RAW_TOKEN } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given('ESI_ACCESS_TOKEN holds an access token', function () {
  this.cleanups.push(withAccessTokenEnv(RAW_TOKEN));
});

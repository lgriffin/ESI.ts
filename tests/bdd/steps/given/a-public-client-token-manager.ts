import { managerState } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given('a public-client token manager', function () {
  managerState(this, { clientSecret: false });
});

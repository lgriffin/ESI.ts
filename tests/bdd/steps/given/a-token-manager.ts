import { managerState } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given('a token manager', function () {
  managerState(this);
});

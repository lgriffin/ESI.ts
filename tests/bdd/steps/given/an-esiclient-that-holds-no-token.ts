import { buildSeamEsiClient } from '../../support/identity-views';
import { Given } from '../../support/steps';

Given('an EsiClient that holds no token', function () {
  buildSeamEsiClient(this);
});

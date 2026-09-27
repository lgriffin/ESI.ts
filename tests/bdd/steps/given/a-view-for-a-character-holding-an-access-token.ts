import { identityFromToken } from '../../../../src/client';
import { RAW_TOKEN, runtimeOf } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given('a view for a character holding an access token', function () {
  this.views.character = runtimeOf(this).as(identityFromToken(RAW_TOKEN));
});

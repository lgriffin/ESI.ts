import { CHARACTER_ID, queueSsoRefresh } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given('SSO issues the character a fresh token', function () {
  this.values.freshToken = queueSsoRefresh(CHARACTER_ID);
});

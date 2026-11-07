import { identityFromToken } from '../../../../src/core/identity';
import { When } from '../../support/steps';

When('an identity is made from the token {string}', function (token: string) {
  this.result = identityFromToken(token);
});

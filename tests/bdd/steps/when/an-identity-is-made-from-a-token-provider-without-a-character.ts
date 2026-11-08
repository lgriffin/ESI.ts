import { identityFromProvider } from '../../../../src/core/identity';
import { When } from '../../support/steps';

When(
  'an identity is made from a token provider without a character',
  function () {
    this.result = identityFromProvider(() => Promise.resolve('token'));
  },
);

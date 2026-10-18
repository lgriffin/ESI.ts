import { identityFromProvider } from '../../../../src';
import { esiClientOf } from '../../support/identity-views';
import { Given } from '../../support/steps';

Given(
  'an identity view of the EsiClient whose provider hands out a new token on each call',
  function () {
    let calls = 0;
    const provider = () => Promise.resolve(`provider-token-${++calls}`);
    this.values.view = esiClientOf(this).as(identityFromProvider(provider));
  },
);

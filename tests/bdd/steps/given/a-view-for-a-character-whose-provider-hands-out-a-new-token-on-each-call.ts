import { identityFromProvider } from '../../../../src/client';
import { runtimeOf } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a view for a character whose provider hands out a new token on each call',
  function () {
    let calls = 0;
    const provider = () => Promise.resolve(`provider-token-${++calls}`);
    this.views.character = runtimeOf(this).as(identityFromProvider(provider));
  },
);

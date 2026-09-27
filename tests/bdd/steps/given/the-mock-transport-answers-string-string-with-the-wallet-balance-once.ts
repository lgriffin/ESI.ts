import { transportOf } from '../../support/mock-transport';
import { WALLET_BALANCE } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'the mock transport answers {string} {string} with the wallet balance once',
  function (method: string, path: string) {
    transportOf(this).respond({
      method,
      path,
      body: WALLET_BALANCE,
      times: 1,
    });
  },
);

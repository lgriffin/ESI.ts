import { identityFromToken } from '../../../../src';
import { esiClientOf } from '../../support/identity-views';
import { RAW_TOKEN } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'an identity view of the EsiClient for a character holding an access token',
  function () {
    this.values.view = esiClientOf(this).as(identityFromToken(RAW_TOKEN));
  },
);

import { identityFromToken } from '../../../../src';
import { customClientOf } from '../../support/custom-client';
import { RAW_TOKEN } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'an identity view of the custom client for a character holding an access token',
  function () {
    this.values.customView = customClientOf(this).as(
      identityFromToken(RAW_TOKEN),
    );
  },
);

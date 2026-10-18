import { identityFromToken } from '../../../../src';
import { makeJwt } from '../../step-definitions/shared/sso-helpers';
import { esiClientOf } from '../../support/identity-views';
import { CHARACTER_ID, OTHER_CHARACTER_ID } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'identity views of the EsiClient for two characters of one corporation',
  function () {
    const client = esiClientOf(this);
    this.values.first = client.as(
      identityFromToken(makeJwt({ characterId: CHARACTER_ID })),
    );
    this.values.second = client.as(
      identityFromToken(makeJwt({ characterId: OTHER_CHARACTER_ID })),
    );
  },
);

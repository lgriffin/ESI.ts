import { identityFromToken } from '../../../../src/client';
import { makeJwt } from '../../step-definitions/shared/sso-helpers';
import {
  CHARACTER_ID,
  OTHER_CHARACTER_ID,
  runtimeOf,
} from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given('views for two characters of one corporation', function () {
  const esi = runtimeOf(this);
  this.views.first = esi.as(
    identityFromToken(makeJwt({ characterId: CHARACTER_ID })),
  );
  this.views.second = esi.as(
    identityFromToken(makeJwt({ characterId: OTHER_CHARACTER_ID })),
  );
});

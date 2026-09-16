import {
  CRIMSON_FURY_SKINR_ID,
  cosmeticsFixtures,
  cosmeticsPaths,
} from '../../support/cosmetics';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a public SKINR design exists', function () {
  queueResponse({
    match: cosmeticsPaths.skinr(CRIMSON_FURY_SKINR_ID),
    body: cosmeticsFixtures.crimsonFury(),
  });
});

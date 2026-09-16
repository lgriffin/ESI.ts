import {
  SKINR_CHARACTER_ID,
  cosmeticsFixtures,
  cosmeticsPaths,
} from '../../support/cosmetics';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the character owns SKINR licenses', function () {
  queueResponse({
    match: cosmeticsPaths.characterSkinr(SKINR_CHARACTER_ID),
    body: cosmeticsFixtures.licences(),
  });
});

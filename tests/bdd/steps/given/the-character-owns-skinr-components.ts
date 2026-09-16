import {
  SKINR_CHARACTER_ID,
  cosmeticsFixtures,
  cosmeticsPaths,
} from '../../support/cosmetics';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the character owns SKINR components', function () {
  queueResponse({
    match: cosmeticsPaths.characterComponents(SKINR_CHARACTER_ID),
    body: cosmeticsFixtures.components(),
  });
});

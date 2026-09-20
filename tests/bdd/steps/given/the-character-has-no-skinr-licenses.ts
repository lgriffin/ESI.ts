import { SKINR_CHARACTER_ID, cosmeticsPaths } from '../../support/cosmetics';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the character has no SKINR licenses', function () {
  queueResponse({
    match: cosmeticsPaths.characterSkinr(SKINR_CHARACTER_ID),
    body: { licenses: [] },
  });
});

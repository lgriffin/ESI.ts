import { SKINR_CHARACTER_ID, cosmeticsPaths } from '../../support/cosmetics';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the license data', function () {
  expect(lastRequest().url.pathname).toBe(
    cosmeticsPaths.characterSkinr(SKINR_CHARACTER_ID),
  );
  expect(lastRequest().headers.authorization).toBe('Bearer bdd-access-token');
  expect(this.result).toEqual({
    licenses: [
      { skinr_id: 'abc-123', activated: true, unactivated: 2 },
      { skinr_id: 'def-456', activated: false, unactivated: 1 },
    ],
  });
});

import { SKINR_CHARACTER_ID, cosmeticsPaths } from '../../support/cosmetics';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return component data with types', function () {
  expect(lastRequest().url.pathname).toBe(
    cosmeticsPaths.characterComponents(SKINR_CHARACTER_ID),
  );
  expect(lastRequest().headers.authorization).toBe('Bearer bdd-access-token');
  expect(this.result.licenses).toHaveLength(2);
  expect(this.result.licenses[0].component_id).toBe(67890);
  expect(this.result.licenses[1].component_id).toBe(67891);
  expect(this.result.licenses[0].type).toBe('nanocoating');
  expect(this.result.licenses[0].runs.remaining).toBe(5);
  expect(this.result.licenses[1].type).toBe('pattern');
  expect(this.result.licenses[1].runs.unlimited).toBe(true);
});

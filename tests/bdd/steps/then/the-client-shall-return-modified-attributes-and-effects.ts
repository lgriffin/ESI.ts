import { MUTATED_ITEM, dogmaFixtures } from '../../support/dogma';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return modified attributes and effects', function () {
  expect(lastRequest().url.pathname).toMatch(
    new RegExp(
      `/dogma/dynamic/items/${MUTATED_ITEM.typeId}/${MUTATED_ITEM.itemId}/?$`,
    ),
  );
  expect(this.result.created_by).toBe(2112625428);
  expect(this.result.mutator_type_id).toBe(47842);
  expect(this.result.source_type_id).toBe(2048);
  expect(this.result.dogma_attributes).toEqual(
    dogmaFixtures.rolledAttributes(),
  );
  expect(this.result.dogma_effects).toEqual(dogmaFixtures.rolledEffects());
});

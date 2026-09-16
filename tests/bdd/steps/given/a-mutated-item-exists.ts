import { MUTATED_ITEM, dogmaFixtures, dogmaPaths } from '../../support/dogma';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a mutated item exists', function () {
  queueResponse({
    match: dogmaPaths.dynamicItem(MUTATED_ITEM),
    body: dogmaFixtures.mutatedItem(),
  });
});

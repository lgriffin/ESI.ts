import { UNKNOWN_DYNAMIC_ITEM, dogmaPaths } from '../../support/dogma';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an invalid type and item ID', function () {
  queueError(404, 'Item not found', {
    match: dogmaPaths.dynamicItem(UNKNOWN_DYNAMIC_ITEM),
  });
});

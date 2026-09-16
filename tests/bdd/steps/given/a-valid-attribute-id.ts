import {
  POWER_OUTPUT_ATTRIBUTE_ID,
  dogmaFixtures,
  dogmaPaths,
} from '../../support/dogma';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid attribute ID', function () {
  queueResponse({
    match: dogmaPaths.attribute(POWER_OUTPUT_ATTRIBUTE_ID),
    body: dogmaFixtures.powerOutput(),
  });
});

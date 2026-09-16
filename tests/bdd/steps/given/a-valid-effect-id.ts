import {
  LOW_POWER_EFFECT_ID,
  dogmaFixtures,
  dogmaPaths,
} from '../../support/dogma';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid effect ID', function () {
  queueResponse({
    match: dogmaPaths.effect(LOW_POWER_EFFECT_ID),
    body: dogmaFixtures.lowPower(),
  });
});

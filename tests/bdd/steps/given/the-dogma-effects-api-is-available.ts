import { dogmaFixtures, dogmaMatches } from '../../support/dogma';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the dogma effects API is available', function () {
  queueResponse({
    match: dogmaMatches.effectIndex,
    body: dogmaFixtures.effectIds(),
  });
});

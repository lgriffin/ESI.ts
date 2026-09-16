import { dogmaFixtures, dogmaMatches } from '../../support/dogma';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the dogma API is available', function () {
  queueResponse({
    match: dogmaMatches.attributeIndex,
    body: dogmaFixtures.attributeIds(),
  });
});

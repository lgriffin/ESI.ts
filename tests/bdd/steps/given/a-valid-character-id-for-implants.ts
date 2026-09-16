import {
  CLONE_CHARACTER_ID,
  cloneFixtures,
  clonePaths,
} from '../../support/clones';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid character ID for implants', function () {
  queueResponse({
    match: clonePaths.implants(CLONE_CHARACTER_ID),
    body: cloneFixtures.fiveImplants(),
  });
});

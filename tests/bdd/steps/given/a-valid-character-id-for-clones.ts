import {
  CLONE_CHARACTER_ID,
  cloneFixtures,
  clonePaths,
} from '../../support/clones';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid character ID for clones', function () {
  queueResponse({
    match: clonePaths.clones(CLONE_CHARACTER_ID),
    body: cloneFixtures.cloneRecord(),
  });
});

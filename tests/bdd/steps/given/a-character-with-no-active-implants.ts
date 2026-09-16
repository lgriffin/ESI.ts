import { CLONE_CHARACTER_ID, clonePaths } from '../../support/clones';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a character with no active implants', function () {
  queueResponse({
    match: clonePaths.implants(CLONE_CHARACTER_ID),
    body: [],
  });
});

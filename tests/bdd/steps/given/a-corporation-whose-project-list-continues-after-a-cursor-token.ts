import {
  PROJECT_CORPORATION_ID,
  projectFixtures,
  projectPaths,
} from '../../support/corporation-projects';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'a corporation whose project list continues after a cursor token',
  function () {
    queueResponse({
      match: projectPaths.list(PROJECT_CORPORATION_ID),
      body: projectFixtures.emptyPage(),
    });
  },
);

import {
  PROJECT_CORPORATION_ID,
  projectFixtures,
  projectPaths,
} from '../../support/corporation-projects';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'a corporation with an active project and a completed project',
  function () {
    queueResponse({
      match: projectPaths.list(PROJECT_CORPORATION_ID),
      body: projectFixtures.listPage(),
    });
  },
);

import {
  ACTIVE_PROJECT_ID,
  PROJECT_CORPORATION_ID,
  projectFixtures,
  projectPaths,
} from '../../support/corporation-projects';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an active corporation project with a manual configuration', function () {
  queueResponse({
    match: projectPaths.detail(PROJECT_CORPORATION_ID, ACTIVE_PROJECT_ID),
    body: projectFixtures.detail(),
  });
});

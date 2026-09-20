import {
  ACTIVE_PROJECT_ID,
  PROJECT_CORPORATION_ID,
  projectFixtures,
  projectPaths,
} from '../../support/corporation-projects';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a corporation project with two contributors', function () {
  queueResponse({
    match: projectPaths.contributors(PROJECT_CORPORATION_ID, ACTIVE_PROJECT_ID),
    body: projectFixtures.contributorsPage(),
  });
});

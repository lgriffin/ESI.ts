import {
  ACTIVE_PROJECT_ID,
  CONTRIBUTOR_CHARACTER_ID,
  PROJECT_CORPORATION_ID,
  projectFixtures,
  projectPaths,
} from '../../support/corporation-projects';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'a project contribution recorded without a modification time',
  function () {
    queueResponse({
      match: projectPaths.contribution(
        PROJECT_CORPORATION_ID,
        ACTIVE_PROJECT_ID,
        CONTRIBUTOR_CHARACTER_ID,
      ),
      body: projectFixtures.contributionWithoutModificationTime(),
    });
  },
);

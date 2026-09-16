import {
  ACTIVE_PROJECT_ID,
  CONTRIBUTOR_CHARACTER_ID,
  PROJECT_CORPORATION_ID,
} from '../../support/corporation-projects';
import { When } from '../../support/steps';

When(
  'the client requests the project contribution of that character',
  async function () {
    this.result =
      await this.client.corporationProjects.getCorporationProjectContribution(
        PROJECT_CORPORATION_ID,
        ACTIVE_PROJECT_ID,
        CONTRIBUTOR_CHARACTER_ID,
      );
  },
);

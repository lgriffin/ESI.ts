import {
  ACTIVE_PROJECT_ID,
  CURSOR_TOKEN,
  PROJECT_CORPORATION_ID,
} from '../../support/corporation-projects';
import { When } from '../../support/steps';

When(
  'the client requests the project contributor roll after that token',
  async function () {
    this.result =
      await this.client.corporationProjects.getCorporationProjectContributors(
        PROJECT_CORPORATION_ID,
        ACTIVE_PROJECT_ID,
        undefined,
        CURSOR_TOKEN,
      );
  },
);

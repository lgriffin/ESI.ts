import {
  PROJECT_CORPORATION_ID,
  UNKNOWN_PROJECT_ID,
} from '../../support/corporation-projects';
import { When } from '../../support/steps';

When(
  'the client requests details for the unknown corporation project',
  async function () {
    try {
      await this.client.corporationProjects.getCorporationProject(
        PROJECT_CORPORATION_ID,
        UNKNOWN_PROJECT_ID,
      );
    } catch (error) {
      this.error = error;
    }
  },
);

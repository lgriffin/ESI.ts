import {
  ACTIVE_PROJECT_ID,
  PROJECT_CORPORATION_ID,
} from '../../support/corporation-projects';
import { When } from '../../support/steps';

When('the client requests the corporation project details', async function () {
  this.result = await this.client.corporationProjects.getCorporationProject(
    PROJECT_CORPORATION_ID,
    ACTIVE_PROJECT_ID,
  );
});

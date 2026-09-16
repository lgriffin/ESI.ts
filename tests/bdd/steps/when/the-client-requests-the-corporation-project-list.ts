import { PROJECT_CORPORATION_ID } from '../../support/corporation-projects';
import { When } from '../../support/steps';

When('the client requests the corporation project list', async function () {
  this.result = await this.client.corporationProjects.getCorporationProjects(
    PROJECT_CORPORATION_ID,
  );
});

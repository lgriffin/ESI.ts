import {
  CURSOR_TOKEN,
  PROJECT_CORPORATION_ID,
} from '../../support/corporation-projects';
import { When } from '../../support/steps';

When(
  'the client requests the corporation project list after that token',
  async function () {
    this.result = await this.client.corporationProjects.getCorporationProjects(
      PROJECT_CORPORATION_ID,
      undefined,
      CURSOR_TOKEN,
    );
  },
);

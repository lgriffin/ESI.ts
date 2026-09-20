import { GOONSWARM_ALLIANCE_ID } from '../../support/alliance';
import { When } from '../../support/steps';

When('the client requests alliance details', async function () {
  this.result = await this.client.alliance.getAllianceById(
    GOONSWARM_ALLIANCE_ID,
  );
});

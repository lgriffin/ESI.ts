import { GOONSWARM_ALLIANCE_ID } from '../../support/alliance';
import { When } from '../../support/steps';

When('the client requests alliance data', async function () {
  const startTime = Date.now();
  this.result = await this.client.alliance.getAllianceById(
    GOONSWARM_ALLIANCE_ID,
  );
  this.values.responseTime = Date.now() - startTime;
});

import { JITA_STATION_ID } from '../../support/universe';
import { When } from '../../support/steps';

When('the client requests station information', async function () {
  this.result = await this.client.universe.getStationById(JITA_STATION_ID);
});

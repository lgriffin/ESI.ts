import { STATUS_PATH, serverStatus } from '../../support/request-headers';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI reports the server status without its player count', function () {
  const body: Record<string, unknown> = { ...serverStatus() };
  delete body.players;
  this.values.sentBody = body;
  queueResponse({ match: STATUS_PATH, body });
});

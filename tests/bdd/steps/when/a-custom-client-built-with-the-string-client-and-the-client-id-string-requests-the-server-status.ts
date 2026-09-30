import { buildCustomClient } from '../../support/custom-client';
import { When } from '../../support/steps';

When(
  'a custom client built with the {string} client and the client ID {string} requests the server status',
  async function (client: string, clientId: string) {
    const custom = buildCustomClient(this, [client], clientId);
    this.result = await custom.status!.getStatus();
  },
);

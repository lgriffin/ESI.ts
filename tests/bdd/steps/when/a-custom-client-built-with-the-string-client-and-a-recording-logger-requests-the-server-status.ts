import { buildCustomClient } from '../../support/custom-client';
import { recordingLogger } from '../../support/logging';
import { When } from '../../support/steps';

When(
  'a custom client built with the {string} client and a recording logger requests the server status',
  async function (client: string) {
    const logger = recordingLogger();
    this.values.logger = logger;
    const custom = buildCustomClient(this, [client], undefined, { logger });
    this.result = await custom.status!.getStatus();
  },
);

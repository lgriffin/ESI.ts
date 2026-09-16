import { CONCURRENT_SYSTEM_IDS } from '../../support/universe';
import { When } from '../../support/steps';

When(
  'the client requests the prepared systems simultaneously',
  async function () {
    this.result = await Promise.all(
      CONCURRENT_SYSTEM_IDS.map((id) => this.client.universe.getSystemById(id)),
    );
  },
);

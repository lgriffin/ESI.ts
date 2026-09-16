import { JITA, UNREACHABLE_SYSTEM_ID } from '../../support/route';
import { When } from '../../support/steps';

When(
  'the client requests a route to unreachable destination',
  async function () {
    try {
      await this.client.route.getRoute(JITA, UNREACHABLE_SYSTEM_ID);
    } catch (e) {
      this.error = e;
    }
  },
);

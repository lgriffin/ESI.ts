import { EsiClient } from '../../../../src/EsiClient';
import { When } from '../../support/steps';

When(
  'an EsiClient is constructed with the base URL {string} and unsafeAllowCustomHost',
  function (baseUrl: string) {
    try {
      const client = new EsiClient({
        baseUrl,
        unsafeAllowCustomHost: true,
        logLevel: 'error',
      });
      this.cleanups.push(() => client.shutdown());
      this.result = client;
    } catch (error) {
      this.error = error;
    }
  },
);

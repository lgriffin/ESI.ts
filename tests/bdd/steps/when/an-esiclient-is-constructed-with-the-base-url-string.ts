import { EsiClient } from '../../../../src/EsiClient';
import { When } from '../../support/steps';

When(
  'an EsiClient is constructed with the base URL {string}',
  function (baseUrl: string) {
    try {
      this.result = new EsiClient({ baseUrl, logLevel: 'error' });
      this.cleanups.push(() => (this.result as EsiClient).shutdown());
    } catch (error) {
      this.error = error;
    }
  },
);

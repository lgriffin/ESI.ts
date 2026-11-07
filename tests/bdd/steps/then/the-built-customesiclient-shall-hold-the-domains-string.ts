import type { CustomEsiClient } from '../../../../src/EsiClientBuilder';
import { Then } from '../../support/steps';

Then(
  'the built CustomEsiClient shall hold the domains {string}',
  function (domains: string) {
    expect(
      (this.result as CustomEsiClient).getEnabledClients().join(', '),
    ).toBe(domains);
  },
);

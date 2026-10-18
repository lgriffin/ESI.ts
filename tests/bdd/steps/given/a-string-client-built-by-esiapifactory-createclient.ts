import {
  EsiApiFactory,
  type ApiClientType,
} from '../../../../src/EsiClientBuilder';
import { SEAM_RETRY } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'a {string} client built by EsiApiFactory.createClient',
  function (name: string) {
    const client = EsiApiFactory.createClient(name as ApiClientType, {
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
      retryConfig: SEAM_RETRY,
      logLevel: 'error',
      rateLimiterConfig: { minDelayMs: 0 },
    });
    this.cleanups.push(() => client.shutdown());
    this.values.factoryClient = client;
  },
);

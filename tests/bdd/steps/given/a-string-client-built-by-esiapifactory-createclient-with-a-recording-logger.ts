import {
  EsiApiFactory,
  type ApiClientType,
} from '../../../../src/EsiClientBuilder';
import { recordingLogger } from '../../support/logging';
import { SEAM_RETRY } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'a {string} client built by EsiApiFactory.createClient with a recording logger',
  function (name: string) {
    const logger = recordingLogger();
    const client = EsiApiFactory.createClient(name as ApiClientType, {
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
      retryConfig: SEAM_RETRY,
      logger,
      logLevel: 'trace',
      rateLimiterConfig: { minDelayMs: 0 },
    });
    this.cleanups.push(() => client.shutdown());
    this.values.factoryClient = client;
    this.values.factoryLogger = logger;
  },
);

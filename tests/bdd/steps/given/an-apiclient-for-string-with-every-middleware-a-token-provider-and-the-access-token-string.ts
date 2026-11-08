import { useLogger } from '../../support/pipeline-parts';
import { ApiClient } from '../../../../src/core/ApiClient';
import { configureApiClient } from '../../../../src/core/configureApiClient';
import { Given } from '../../support/steps';

Given(
  'an ApiClient for {string} with every middleware, a token provider and the access token {string}',
  function (link: string, token: string) {
    const logger = useLogger(this);
    const client = new ApiClient('bdd-parts', link, token);
    configureApiClient(client, {
      logger,
      enableCircuitBreaker: true,
      validateResponse: false,
      validateRequest: true,
      timeout: 5000,
    });
    client.setDatasource('singularity');
    client.setLanguage('de');
    client.setCompatibilityDate('2020-01-01');
    client.setTokenProvider(() => Promise.resolve('next-token'));
    this.values.apiClient = client;
    this.cleanups.push(() => {
      client.getCache()?.shutdown?.();
      client.getCircuitBreaker()?.shutdown();
    });
  },
);

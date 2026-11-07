import { ApiClient } from '../../../../src/core/ApiClient';
import { configureApiClient } from '../../../../src/core/configureApiClient';
import type { LogLevel } from '../../../../src/core/logger/DefaultLogger';
import { Given } from '../../support/steps';

Given(
  'an ApiClient configured with the log level {string} and no logger',
  function (level: string) {
    const client = new ApiClient('bdd-parts', 'https://esi.evetech.net');
    configureApiClient(client, { logLevel: level as LogLevel });
    this.values.apiClient = client;
    this.cleanups.push(() => client.getCache()?.shutdown?.());
  },
);

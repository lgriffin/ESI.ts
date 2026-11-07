import { useLogger } from '../../support/pipeline-parts';
import { ApiClient } from '../../../../src/core/ApiClient';
import { RetryStrategy } from '../../../../src/core/RetryStrategy';
import { ManualClock } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a retry strategy allowing {int} retries with a base delay of {int} ms and a cap of {int} ms',
  function (maxRetries: number, baseDelayMs: number, maxDelayMs: number) {
    const logger = useLogger(this);
    const client = new ApiClient('bdd-parts', 'https://esi.evetech.net');
    client.setLogger(logger);
    const clock = new ManualClock();
    client.setClock(clock);
    this.values.retryClient = client;
    this.values.refreshes = 0;
    this.values.refresh = (): Promise<void> => {
      this.values.refreshes += 1;
      return Promise.resolve();
    };
    this.values.strategy = new RetryStrategy({
      maxRetries,
      baseDelayMs,
      maxDelayMs,
    });
  },
);

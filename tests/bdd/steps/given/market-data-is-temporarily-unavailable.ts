import { marketPaths } from '../../support/market';
import { queueError, RETRYABLE_ATTEMPTS } from '../../support/transport';
import { Given } from '../../support/steps';

Given('market data is temporarily unavailable', function () {
  // 503 is retryable, so the outage has to outlast the retry budget.
  queueError(503, 'Market data unavailable', {
    match: marketPaths.prices,
    times: RETRYABLE_ATTEMPTS,
  });
});

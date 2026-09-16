import {
  CONCURRENT_REGIONS,
  marketFixtures,
  marketPaths,
} from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('multiple concurrent market data requests', function () {
  // Queued in reverse, with the first region answered last, so a client that
  // paired responses to requests by arrival order rather than by URL would
  // hand back the wrong book.
  [...CONCURRENT_REGIONS].reverse().forEach((regionId) => {
    const position = CONCURRENT_REGIONS.indexOf(regionId);
    queueResponse({
      match: marketPaths.orders(regionId),
      delayMs: (CONCURRENT_REGIONS.length - position) * 5,
      body: marketFixtures.singleOrderFor(position),
    });
  });
});
